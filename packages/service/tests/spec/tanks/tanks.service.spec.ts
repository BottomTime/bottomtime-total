import { TankMaterial } from '@bottomtime/api';
import { TankModel } from '../../../src/schemas';
import {
  CreateTankOptions,
  TanksService,
  UpdateTankOptions,
} from '../../../src/tanks/tanks.service';
import TankData from '../../fixtures/pre-defined-tanks.json';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const UserIds = [
  '3DFB75CC-4193-42C5-B8BF-87438C5A79CB',
  'C613704D-4C9C-4A4F-982A-9FE8521DBA4C',
];

describe('Tanks Service', () => {
  let service: TanksService;

  beforeEach(() => {
    service = new TanksService(TankModel);
  });

  describe('when listing tanks', () => {
    beforeEach(async () => {
      const tanks = TankData.map((tank, index) => {
        const document = new TankModel(tank);
        if (index % 2 === 0) {
          document.user = index % 4 === 0 ? UserIds[0] : UserIds[1];
        }
        return document;
      });
      await TankModel.insertMany(tanks);
    });

    it('will list system tanks', async () => {
      const tanks = await service.listTanks();
      expect(tanks).toMatchSnapshot();
    });

    it('will list user tanks', async () => {
      const tanks = await service.listTanks({
        userId: UserIds[0],
      });
      expect(tanks).toMatchSnapshot();
    });

    it('will list both system and user tanks', async () => {
      const tanks = await service.listTanks({
        userId: UserIds[1],
        includeSystem: true,
      });
      expect(tanks).toMatchSnapshot();
    });
  });

  describe('when retrieving a single tank', () => {
    it('will retrieve a single tank', async () => {
      const data = new TankModel(TankData[0]);
      await data.save();
      const tank = await service.getTank(data._id);
      expect(tank).toMatchSnapshot();
    });

    it('will return undefined if the tank cannot be found', async () => {
      const tank = await service.getTank(TankData[4]._id);
      expect(tank).toBeUndefined();
    });
  });

  describe('when creating a new tank', () => {
    it('will create a new system tank', async () => {
      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const tank = await service.createTank(options);
      expect(tank.id).toBeDefined();
      expect(tank).toEqual({
        ...options,
        id: tank.id,
      });

      const result = await TankModel.findById(tank.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.name).toBe(options.name);
      expect(result!.material).toBe(options.material);
      expect(result!.volume).toBe(options.volume);
      expect(result!.workingPressure).toBe(options.workingPressure);
      expect(result!.user).toBeUndefined();
    });

    it('will create a new user-defined tank', async () => {
      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
        userId: UserIds[0],
      };

      const tank = await service.createTank(options);
      expect(tank.id).toBeDefined();
      expect(tank).toEqual({
        ...options,
        id: tank.id,
      });

      const result = await TankModel.findById(tank.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.name).toBe(options.name);
      expect(result!.material).toBe(options.material);
      expect(result!.volume).toBe(options.volume);
      expect(result!.workingPressure).toBe(options.workingPressure);
      expect(result!.user).toBe(options.userId);
    });

    it('will limit users to 10 pre-defined tanks', async () => {
      const userTanksData = TankData.slice(0, 10).map(
        (tank) =>
          new TankModel({
            ...tank,
            user: UserIds[0],
          }),
      );
      await TankModel.insertMany(userTanksData);

      const options: CreateTankOptions = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
        userId: UserIds[0],
      };

      await expect(service.createTank(options)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('when updating tanks', () => {
    it('will update a system tank', async () => {
      const update: UpdateTankOptions = {
        name: 'Updated Name',
        material: TankMaterial.Steel,
        volume: 7.7,
        workingPressure: 99.9,
      };
      const data = new TankModel(TankData[0]);
      await data.save();

      const tank = await service.updateTank(data._id, update);

      const result = await TankModel.findById(data._id);
      expect(tank).toMatchSnapshot();
      expect(result).toMatchSnapshot();
    });

    it('will update a user-defined tank', async () => {
      const update: UpdateTankOptions = {
        name: 'Updated Name',
        material: TankMaterial.Steel,
        volume: 7.7,
        workingPressure: 99.9,
      };
      const data = new TankModel({
        ...TankData[0],
        user: UserIds[0],
      });
      await data.save();

      const tank = await service.updateTank(data._id, update);

      const result = await TankModel.findById(data._id);
      expect(tank).toMatchSnapshot();
      expect(result).toMatchSnapshot();
    });

    it('will throw a NotFoundException if the tank does not exist', async () => {
      const tankId = '5126F77E-B50E-4C25-A050-758D08A298A2';
      const update: UpdateTankOptions = {
        name: 'Updated Name',
        material: TankMaterial.Steel,
        volume: 7.7,
        workingPressure: 99.9,
      };

      await expect(service.updateTank(tankId, update)).rejects.toThrow(
        NotFoundException,
      );

      const result = await TankModel.findById(tankId);
      expect(result).toBeNull();
    });
  });

  describe('when deleting tanks', () => {
    it('will delete the indicated tank', async () => {
      const data = new TankModel(TankData[0]);
      await data.save();

      await expect(service.deleteTank(data._id)).resolves.toBe(true);

      const exists = await TankModel.exists({ _id: data._id });
      expect(exists).toBeNull();
    });

    it('will return false if the tank does not exist', async () => {
      await expect(service.deleteTank(TankData[0]._id)).resolves.toBe(false);
    });
  });
});
