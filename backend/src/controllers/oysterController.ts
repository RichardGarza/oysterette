import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import Fuse from 'fuse.js';

// Get all oysters
export const getAllOysters = async (req: Request, res: Response): Promise<void> => {
  try {
    const oysters = await prisma.oyster.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: oysters.length,
      data: oysters,
    });
  } catch (error) {
    logger.error('Get all oysters error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single oyster by ID
export const getOysterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const oyster = await prisma.oyster.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!oyster) {
      res.status(404).json({
        success: false,
        error: 'Oyster not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: oyster,
    });
  } catch (error) {
    logger.error('Get oyster by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new oyster (requires authentication)
export const createOyster = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      species,
      origin,
      standoutNotes,
      size,
      body,
      sweetBrininess,
      flavorfulness,
      creaminess,
    } = req.body;

    // Validation
    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      });
      return;
    }

    // Check if oyster already exists
    const existingOyster = await prisma.oyster.findUnique({
      where: { name },
    });

    if (existingOyster) {
      res.status(400).json({
        success: false,
        error: 'An oyster with this name already exists',
      });
      return;
    }

    const oyster = await prisma.oyster.create({
      data: {
        name,
        species: species || 'Unknown',
        origin: origin || 'Unknown',
        standoutNotes,
        size: size || 5,
        body: body || 5,
        sweetBrininess: sweetBrininess || 5,
        flavorfulness: flavorfulness || 5,
        creaminess: creaminess || 5,
      },
    });

    res.status(201).json({
      success: true,
      data: oyster,
    });
  } catch (error) {
    logger.error('Create oyster error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid data',
    });
  }
};

// Update oyster
export const updateOyster = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const oyster = await prisma.oyster.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: oyster,
    });
  } catch (error) {
    logger.error('Update oyster error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update oyster',
    });
  }
};

// Delete oyster
export const deleteOyster = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.oyster.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete oyster error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Search oysters by name or origin with fuzzy matching
export const searchOysters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
      return;
    }

    // Get all oysters from database
    const allOysters = await prisma.oyster.findMany({
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(allOysters, {
      keys: [
        { name: 'name', weight: 0.5 },        // Name is most important
        { name: 'origin', weight: 0.3 },      // Origin is second
        { name: 'species', weight: 0.2 },     // Species is least important
      ],
      threshold: 0.4,           // 0 = exact match, 1 = match anything
      distance: 100,            // How far to search for patterns
      includeScore: true,       // Include match score
      minMatchCharLength: 2,    // Minimum characters to match
      ignoreLocation: true,     // Search anywhere in the string
    });

    // Perform fuzzy search
    const searchResults = fuse.search(query);

    // Extract the oyster data from results
    const oysters = searchResults.map(result => result.item);

    logger.info(`Fuzzy search for "${query}" returned ${oysters.length} results`);

    res.status(200).json({
      success: true,
      count: oysters.length,
      data: oysters,
    });
  } catch (error) {
    logger.error('Search oysters error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
