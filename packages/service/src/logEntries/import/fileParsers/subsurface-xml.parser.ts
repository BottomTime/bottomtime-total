import { CreateOrUpdateLogEntryParamsDTO } from '@bottomtime/api';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  bufferCount,
  catchError,
  concatMap,
  from,
  lastValueFrom,
  map,
} from 'rxjs';
import { DiveSite } from 'src/diveSites';
import { Tank, TanksService } from 'src/tanks';
import { User } from 'src/users';
import { parseStringPromise } from 'xml2js';
import { z } from 'zod';

import { IImportFileParser, ImportFileResult } from '../import-file-parser';
import { LogEntryImportService } from '../log-entry-import.service';

const SubsurfaceXmlDiveSchema = z.object({
  $: z.object({
    number: z.coerce.number().optional(),
    rating: z.coerce.number().optional(),
    visibility: z.coerce.number().optional(),
    current: z.coerce.number().optional(),
    sac: z.string().optional(),
    otu: z.coerce.number().optional(),
    cns: z.string().optional(),
    tags: z.string().optional(),
    divesiteid: z.string().optional(),
    watersalinity: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    duration: z.string().optional(),
  }),

  divemaster: z.string().array().optional(),
  buddy: z.string().array().optional(),
  notes: z.string().array().optional(),
  suit: z.string().array().optional(),

  cylinder: z
    .object({
      $: z.object({
        size: z.string().optional(),
        workpressure: z.string().optional(),
        description: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        depth: z.string().optional(),
      }),
    })
    .array()
    .optional(),

  weightsystem: z
    .object({
      $: z.object({
        weight: z.string().optional(),
        description: z.string().optional(),
      }),
    })
    .array()
    .optional(),

  divetemperature: z
    .object({
      $: z.object({
        air: z.string().optional(),
        water: z.string().optional(),
      }),
    })
    .array()
    .optional(),

  divecomputer: z
    .object({
      $: z.object({
        model: z.string().optional(),
        'last-manual-time': z.string().optional(),
      }),

      depth: z
        .object({
          $: z.object({
            max: z.string().optional(),
            mean: z.string().optional(),
          }),
        })
        .array()
        .optional(),

      sample: z
        .object({
          $: z.object({
            time: z.string().optional(),
            depth: z.string().optional(),
          }),
        })
        .array()
        .optional(),
    })
    .array()
    .optional(),
});
type SubsurfaceXmlDive = z.infer<typeof SubsurfaceXmlDiveSchema>;

const SubsurfaceXmlSchema = z.object({
  divelog: z.object({
    $: z.object({
      program: z.string(),
      version: z.string(),
    }),

    // settings: z.unknown(),

    divesites: z
      .object({
        site: z
          .object({
            $: z.object({
              uuid: z.string(),
              name: z.string(),
              gps: z.string(),
            }),

            geo: z
              .object({
                $: z.object({
                  cat: z.coerce.number().optional(),
                  origin: z.coerce.number().optional(),
                  value: z.string().optional(),
                }),
              })
              .array()
              .optional(),

            notes: z.string().array().optional(),
          })
          .array()
          .optional(),
      })
      .array()
      .optional(),

    dives: z
      .object({
        dive: SubsurfaceXmlDiveSchema.array().optional(),
      })
      .array(),
  }),
});
type SubsurfaceXml = z.infer<typeof SubsurfaceXmlSchema>;

@Injectable()
export class SubsurfaceXMLParser implements IImportFileParser {
  private readonly log = new Logger(SubsurfaceXMLParser.name);

  constructor(
    @Inject(LogEntryImportService)
    private readonly importService: LogEntryImportService,

    @Inject(TanksService)
    private readonly tanksService: TanksService,
  ) {}

  private async findSites(): Promise<Record<string, DiveSite>> {
    return {};
  }

  private transformDive(
    dive: SubsurfaceXmlDive,
  ): CreateOrUpdateLogEntryParamsDTO {
    return {
      timing: {
        duration: 0,
        entryTime: new Date(`${dive.$.date}T${dive.$.time}Z`).valueOf(),
        timezone: 'UTC', // TODO: Can we derive the timezone from the site?
      },
      air: [], // TODO
      conditions: {}, // TODO
      depths: {}, // TODO
      equipment: {}, // TODO
      logNumber: dive.$.number,
      notes: dive.notes ? dive.notes[0] : undefined,
      rating: dive.$.rating,
      samples: [], // TODO
      site: undefined, // TODO
      tags: dive.$.tags
        ? dive.$.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '')
        : undefined,
    };
  }

  async parseFile(
    file: Express.Multer.File,
    owner: User,
  ): Promise<ImportFileResult> {
    let rawData: string;

    const { data: tanks } = await this.tanksService.listTanks({
      userId: owner.id,
      includeSystem: true,
    });

    try {
      this.log.debug('Attempting to parse Subsurface XML file...');
      rawData = await parseStringPromise(file.buffer, {});
    } catch (error) {
      this.log.error(error);
      return {
        success: false,
        error: error as Error,
      };
    }

    const parsedData = SubsurfaceXmlSchema.safeParse(rawData);

    if (!parsedData.success) {
      this.log.error(
        'Subsurface XML file did not match validation schema.',
        parsedData.error,
      );
      return {
        success: false,
        error: parsedData.error,
      };
    }

    const xml: SubsurfaceXml = parsedData.data;
    if (!xml.divelog.dives[0]?.dive?.length) {
      this.log.error(
        'No dives found in Subsurface XML file. Unable to import.',
      );
      return {
        success: false,
        error: new BadRequestException(
          'No dives found in file. Unable to import.',
        ),
      };
    }

    this.log.debug('Finished parsing Subsurface XML. Generating import...');
    this.log.verbose(parsedData.data);

    const logImport = await this.importService.createImport(owner, {
      device: `${xml.divelog.$.program}-${xml.divelog.$.version}`,
    });

    await lastValueFrom(
      from(xml.divelog.dives[0].dive).pipe(
        map(this.transformDive),
        bufferCount(20),
        concatMap(async (records) => {
          await logImport.addRecords(records);
        }),
        catchError((error) => {
          this.log.error(
            `Error while processing dive record for import with ID ${logImport.id}`,
            error,
          );
          logImport
            .cancel()
            .then(() => {
              this.log.warn(
                `Marked import with ID ${logImport.id} as canceled as a result of import failure.`,
              );
            })
            .catch((error) => {
              this.log.error(
                `Failed to mark import with ID ${logImport.id} as canceled.`,
                error,
              );
            });
          throw error;
        }),
      ),
    );

    return {
      success: true,
      import: logImport,
    };
  }
}
