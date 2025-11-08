/**
 * Oyster Controller
 *
 * Handles oyster data operations including:
 * - Fetching all oysters with filtering and sorting
 * - Getting individual oyster details with reviews
 * - Creating, updating, and deleting oysters
 * - Fuzzy search functionality
 * - Filter options for UI dropdown/chips
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import Fuse from 'fuse.js';

/**
 * Get all oysters with optional filtering and sorting
 *
 * Supports attribute-based filtering and bidirectional sorting for flexible
 * oyster discovery and browsing.
 *
 * @route GET /api/oysters
 * @param req.query.sortBy - Sort by: rating | name | size | sweetness | creaminess | flavorfulness | body
 * @param req.query.sortDirection - Sort direction: asc | desc (default: desc for attributes, asc for name)
 * @param req.query.sweetness - Filter by sweetness (fuzzy ±2): low (1-6) | high (4-10)
 * @param req.query.size - Filter by size (fuzzy ±2): low (1-6) | high (4-10)
 * @param req.query.body - Filter by body (fuzzy ±2): low (1-6) | high (4-10)
 * @param req.query.flavorfulness - Filter by flavorfulness (fuzzy ±2): low (1-6) | high (4-10)
 * @param req.query.creaminess - Filter by creaminess (fuzzy ±2): low (1-6) | high (4-10)
 * @returns 200 - Array of oysters with review counts
 * @returns 500 - Server error
 *
 * @example
 * GET /api/oysters?sweetness=low&sortBy=rating&sortDirection=desc  // Returns oysters with sweetness 1-6
 * GET /api/oysters?size=high&body=high&sortBy=name&sortDirection=asc  // Returns oysters with size 4-10 AND body 4-10
 */
export const getAllOysters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sortBy, sortDirection, sweetness, size, body, flavorfulness, creaminess } = req.query;

    // Build where clause for attribute filtering
    // Fuzzy matching: ±2 range for more flexible filtering
    // - 'low' matches 1-6 (low end of spectrum)
    // - 'high' matches 4-10 (high end of spectrum)
    // - Overlap at 4-6 creates fuzzy matching
    const where: any = {};

    // Sweetness filter (±2 fuzzy range) - check both avg and seed data
    if (sweetness && typeof sweetness === 'string') {
      const range = sweetness === 'low' ? { gte: 1, lte: 6 } : { gte: 4, lte: 10 };
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { avgSweetBrininess: range },
          { AND: [{ avgSweetBrininess: null }, { sweetBrininess: range }] }
        ]
      });
    }

    // Size filter (±2 fuzzy range) - check both avg and seed data
    if (size && typeof size === 'string') {
      const range = size === 'low' ? { gte: 1, lte: 6 } : { gte: 4, lte: 10 };
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { avgSize: range },
          { AND: [{ avgSize: null }, { size: range }] }
        ]
      });
    }

    // Body filter (±2 fuzzy range) - check both avg and seed data
    if (body && typeof body === 'string') {
      const range = body === 'low' ? { gte: 1, lte: 6 } : { gte: 4, lte: 10 };
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { avgBody: range },
          { AND: [{ avgBody: null }, { body: range }] }
        ]
      });
    }

    // Flavorfulness filter (±2 fuzzy range) - check both avg and seed data
    if (flavorfulness && typeof flavorfulness === 'string') {
      const range = flavorfulness === 'low' ? { gte: 1, lte: 6 } : { gte: 4, lte: 10 };
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { avgFlavorfulness: range },
          { AND: [{ avgFlavorfulness: null }, { flavorfulness: range }] }
        ]
      });
    }

    // Creaminess filter (±2 fuzzy range) - check both avg and seed data
    if (creaminess && typeof creaminess === 'string') {
      const range = creaminess === 'low' ? { gte: 1, lte: 6 } : { gte: 4, lte: 10 };
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { avgCreaminess: range },
          { AND: [{ avgCreaminess: null }, { creaminess: range }] }
        ]
      });
    }

    // Determine sort direction (default based on sort type)
    const direction = sortDirection === 'asc' || sortDirection === 'desc'
      ? sortDirection
      : (sortBy === 'name' ? 'asc' : 'desc');

    // Determine order by clause
    let orderBy: any = { name: 'asc' }; // Default sort
    if (sortBy && typeof sortBy === 'string') {
      switch (sortBy) {
        case 'rating':
          orderBy = { avgRating: direction };
          break;
        case 'name':
          orderBy = { name: direction };
          break;
        case 'size':
          orderBy = { avgSize: direction };
          break;
        case 'sweetness':
          orderBy = { avgSweetBrininess: direction };
          break;
        case 'creaminess':
          orderBy = { avgCreaminess: direction };
          break;
        case 'flavorfulness':
          orderBy = { avgFlavorfulness: direction };
          break;
        case 'body':
          orderBy = { avgBody: direction };
          break;
        default:
          orderBy = { name: 'asc' };
      }
    }

    const oysters = await prisma.oyster.findMany({
      where,
      orderBy,
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

/**
 * Get single oyster by ID with full details
 *
 * Includes all associated reviews with user information, ordered by most recent.
 * Used for the oyster detail screen.
 *
 * @route GET /api/oysters/:id
 * @param req.params.id - Oyster UUID
 * @returns 200 - Oyster with reviews array and review count
 * @returns 404 - Oyster not found
 * @returns 500 - Server error
 */
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

/**
 * Create a new oyster
 *
 * Creates a new oyster entry with base attribute ratings.
 * Attributes default to 5 (neutral) if not provided.
 * Names must be unique.
 *
 * @route POST /api/oysters
 * @requires Authentication
 * @param req.body.name - Unique oyster name (required)
 * @param req.body.species - Species name (defaults to "Unknown")
 * @param req.body.origin - Geographic origin (defaults to "Unknown")
 * @param req.body.standoutNotes - Notable characteristics (optional)
 * @param req.body.size - Base size rating 1-10 (defaults to 5)
 * @param req.body.body - Base body rating 1-10 (defaults to 5)
 * @param req.body.sweetBrininess - Base sweet/briny rating 1-10 (defaults to 5)
 * @param req.body.flavorfulness - Base flavor rating 1-10 (defaults to 5)
 * @param req.body.creaminess - Base creaminess rating 1-10 (defaults to 5)
 * @returns 201 - Created oyster object
 * @returns 400 - Validation error or duplicate name
 */
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

/**
 * Update an existing oyster
 *
 * @route PUT /api/oysters/:id
 * @requires Authentication
 * @param req.params.id - Oyster UUID
 * @param req.body - Fields to update (partial oyster object)
 * @returns 200 - Updated oyster object
 * @returns 400 - Invalid data or oyster not found
 */
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

/**
 * Delete an oyster
 *
 * Cascade deletes all associated reviews due to Prisma schema configuration.
 *
 * @route DELETE /api/oysters/:id
 * @requires Authentication
 * @param req.params.id - Oyster UUID
 * @returns 200 - Success confirmation
 * @returns 500 - Server error or oyster not found
 */
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

/**
 * Search oysters with fuzzy matching (powered by Fuse.js)
 *
 * Performs intelligent fuzzy search across oyster names, origins, and species.
 * Handles typos and partial matches. Weighted to prioritize name matches.
 *
 * Search Configuration:
 * - Name: 50% weight (most important)
 * - Origin: 30% weight
 * - Species: 20% weight
 * - Threshold: 0.4 (balance between precision and recall)
 * - Minimum match: 2 characters
 *
 * @route GET /api/oysters/search
 * @param req.query.query - Search term (minimum 2 characters)
 * @returns 200 - Array of matching oysters sorted by relevance
 * @returns 400 - Missing or invalid search query
 * @returns 500 - Server error
 *
 * @example
 * GET /api/oysters/search?query=kushi
 * // Returns: Kusshi, Kumamoto (fuzzy matched despite typo)
 */
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
