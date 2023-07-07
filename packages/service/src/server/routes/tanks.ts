import { Express } from 'express';
import { NextFunction, Request, Response } from 'express';
import { MissingResourceError } from '../../errors';
import { requireAdmin } from './auth';

export async function loadPreDefinedTank(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    req.selectedTank = await req.tankManager.getTank(req.params.tankId);

    if (!req.selectedTank) {
      next(
        new MissingResourceError(
          `Unable to find pre-defined tank with ID: ${req.params.tankId}`,
        ),
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function getPreDefinedTank(req: Request, res: Response) {
  res.json(req.selectedTank);
}

export async function listPreDefinedTanks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const results = await req.tankManager.listTanks();
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function createPreDefinedTank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tank = await req.tankManager.createTank(req.body);
    res.status(201).json(tank);
  } catch (error) {
    next(error);
  }
}

export async function updatePreDefinedTank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tank = req.selectedTank!;

    tank.name = req.body.name;
    tank.material = req.body.material;
    tank.volume = req.body.volume;
    tank.workingPressure = req.body.workingPressure;

    await tank.save();
    res.json(tank);
  } catch (error) {
    next(error);
  }
}

export async function patchPreDefinedTank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tank = req.selectedTank!;
    const data = {
      ...tank.toJSON(),
      ...req.body,
    };

    tank.name = data.name;
    tank.material = data.material;
    tank.volume = data.volume;
    tank.workingPressure = data.workingPressure;

    await tank.save();
    res.json(tank);
  } catch (error) {
    next(error);
  }
}

export async function deletePreDefinedTank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await req.selectedTank!.delete();
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export function configureTanksRoutes(app: Express) {
  app
    .route('/tanks')
    .get(listPreDefinedTanks)
    .post(requireAdmin, createPreDefinedTank);
  app
    .route('/tanks/:tankId')
    .get(loadPreDefinedTank, getPreDefinedTank)
    .put(requireAdmin, loadPreDefinedTank, updatePreDefinedTank)
    .patch(requireAdmin, loadPreDefinedTank, patchPreDefinedTank)
    .delete(requireAdmin, loadPreDefinedTank, deletePreDefinedTank);
}
