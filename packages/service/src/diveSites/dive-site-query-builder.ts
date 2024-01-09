import { FilterQuery } from 'mongoose';
import { DiveSiteData } from '../schemas';
import { GpsCoordinates, RatingRange } from '@bottomtime/api';

const RadiusOfEarthInKm = 6371;

export class DiveSiteQueryBuilder {
  private readonly query: FilterQuery<DiveSiteData> = {};

  build(): FilterQuery<DiveSiteData> {
    return this.query;
  }

  withCreatorId(creatorId?: string): this {
    if (creatorId) {
      this.query.creator = creatorId;
    }
    return this;
  }

  withDifficulty(difficulty?: RatingRange): this {
    if (difficulty) {
      this.query.averageDifficulty = {
        $gte: difficulty.min,
        $lte: difficulty.max,
      };
    }
    return this;
  }

  withFreeToDive(freeToDive?: boolean): this {
    if (typeof freeToDive === 'boolean') {
      this.query.freeToDive = freeToDive;
    }
    return this;
  }

  withGeoLocation(position?: GpsCoordinates, radius?: number): this {
    if (position && radius) {
      this.query.gps = {
        $geoWithin: {
          $centerSphere: [
            [position.lon, position.lat],
            radius / RadiusOfEarthInKm,
          ],
        },
      };
    }
    return this;
  }

  withRating(rating?: RatingRange): this {
    if (rating) {
      this.query.averageRating = {
        $gte: rating.min,
        $lte: rating.max,
      };
    }
    return this;
  }

  withShoreAccesss(shoreAccess?: boolean): this {
    if (typeof shoreAccess === 'boolean') {
      this.query.shoreAccess = shoreAccess;
    }
    return this;
  }

  withTextSearch(query?: string): this {
    if (query) {
      this.query.$text = {
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false,
      };
    }
    return this;
  }
}
