import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { transcribeAudio } from '../services/whisper.js';
import { broadcastProgress } from '../app.js';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// POST /api/transcribe — Upload + transcribe an audio file
router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'BadRequest', message: 'No audio file provided' });
  }

  const clientId = req.headers['x-client-id'];
  const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');

  // Create a PENDING record immediately so UI can show progress
  let record;
  try {
    record = await prisma.transcript.create({
      data: {
        title,
        content: '',
        status: 'PROCESSING',
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  } catch (dbErr) {
    return next(dbErr);
  }

  // Notify client: processing started
  broadcastProgress(clientId, { type: 'progress', id: record.id, stage: 'processing', pct: 10 });

  // Run transcription asynchronously, respond immediately with the record id
  res.status(202).json({ id: record.id, status: 'PROCESSING', message: 'Transcription started' });

  // Background transcription
  (async () => {
    try {
      broadcastProgress(clientId, { type: 'progress', id: record.id, stage: 'transcribing', pct: 40 });

      const result = await transcribeAudio(req.file.path);

      broadcastProgress(clientId, { type: 'progress', id: record.id, stage: 'saving', pct: 85 });

      await prisma.transcript.update({
        where: { id: record.id },
        data: {
          content: result.text,
          segments: result.segments,
          language: result.language,
          duration: result.duration,
          status: 'DONE',
        },
      });

      broadcastProgress(clientId, {
        type: 'done',
        id: record.id,
        stage: 'done',
        pct: 100,
        title,
        duration: result.duration,
      });
    } catch (err) {
      console.error('[Transcription] Failed:', err.message);
      await prisma.transcript.update({
        where: { id: record.id },
        data: { status: 'ERROR' },
      });
      broadcastProgress(clientId, { type: 'error', id: record.id, message: err.message });
    } finally {
      // Clean up uploaded file
      fs.unlink(req.file.path, () => {});
    }
  })();
});

// GET /api/transcripts — List all (with search + filter)
router.get('/transcripts', async (req, res, next) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [transcripts, total] = await Promise.all([
      prisma.transcript.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          title: true,
          status: true,
          duration: true,
          language: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
          updatedAt: true,
          content: true,
        },
      }),
      prisma.transcript.count({ where }),
    ]);

    res.json({
      data: transcripts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transcripts/:id — Single transcript (full)
router.get('/transcripts/:id', async (req, res, next) => {
  try {
    const transcript = await prisma.transcript.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!transcript) {
      return res.status(404).json({ error: 'NotFound', message: 'Transcript not found' });
    }

    res.json(transcript);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transcripts/:id — Edit title or content
router.patch('/transcripts/:id', async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title && content === undefined) {
      return res.status(400).json({ error: 'BadRequest', message: 'Provide title or content to update' });
    }

    const updated = await prisma.transcript.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
      },
    });

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NotFound', message: 'Transcript not found' });
    }
    next(err);
  }
});

// DELETE /api/transcripts/:id — Soft delete
router.delete('/transcripts/:id', async (req, res, next) => {
  try {
    await prisma.transcript.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    res.json({ success: true, message: 'Transcript archived' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NotFound', message: 'Transcript not found' });
    }
    next(err);
  }
});

export default router;
