import 'multer';
import { LogEntryImportEntity, UserEntity } from 'src/data';
import { SubsurfaceXMLParser } from 'src/logEntries/import/fileParsers/subsurface-xml.parser';
import { LogEntryImportFactory } from 'src/logEntries/import/log-entry-import-factory';
import { LogEntryImportService } from 'src/logEntries/import/log-entry-import.service';
import { UserFactory } from 'src/users';
import { Readable } from 'stream';
import { dataSource } from 'tests/data-source';
import {
  createLogEntryImportFactory,
  createTestUser,
  createUserFactory,
} from 'tests/utils';
import { Repository } from 'typeorm';

const TestXml = `<divelog program='subsurface' version='3'>
<settings>
</settings>
<divesites>
<site uuid='3b0e20b2' name='Palancar Horseshoe' gps='20.400462 -87.039718'>
  <notes>This site is great. </notes>
  <geo cat='2' origin='2' value='Mexico'/>
</site>
</divesites>
<dives>
<dive number='1' rating='4' visibility='4' current='4' sac='16.861 l/min' otu='3' cns='4%' tags='boat, drift, wreck' divesiteid='3b0e20b2' watersalinity='1030 g/l' date='2025-04-24' time='13:08:19' duration='40:00 min'>
  <divemaster>Joe</divemaster>
  <buddy>Jimmy</buddy>
  <notes>This dive was awesome.</notes>
  <suit>3mm wetsuit</suit>
  <cylinder size='11.094 l' workpressure='206.843 bar' description='AL80' start='207.0 bar' end='57.0 bar' depth='66.0 m' />
  <weightsystem weight='3.3 kg' description='belt' />
  <divetemperature air='27.0 C' water='21.0 C'/>
  <divecomputer model='manually added dive' last-manual-time='40:00 min'>
  <depth max='15.0 m' mean='13.002 m' />
  <sample time='0:00 min' depth='0.0 m' />
  <sample time='1:40 min' depth='15.0 m' />
  <sample time='32:52 min' depth='15.0 m' />
  <sample time='33:59 min' depth='4.95 m' />
  <sample time='39:27 min' depth='4.95 m' />
  <sample time='40:00 min' depth='0.0 m' />
  </divecomputer>
</dive>
</dives>
</divelog>`;

function fileFromString(str: string): Express.Multer.File {
  const buffer = Buffer.from(str);
  return {
    buffer,
    stream: Readable.from(buffer),
    size: buffer.length,
    mimetype: 'text/xml',
    encoding: 'utf8',
    originalname: 'test.xml',
    fieldname: 'file',
    destination: '',
    filename: '',
    path: '',
  };
}

describe('Subsurface XML Parser', () => {
  let Users: Repository<UserEntity>;
  let Imports: Repository<LogEntryImportEntity>;

  let importFactory: LogEntryImportFactory;
  let userFactory: UserFactory;
  let owner: UserEntity;

  let parser: SubsurfaceXMLParser;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);

    importFactory = createLogEntryImportFactory();
    userFactory = createUserFactory();

    parser = new SubsurfaceXMLParser(
      new LogEntryImportService(Imports, importFactory),
    );
  });

  beforeEach(async () => {
    owner = createTestUser();
    await Users.save(owner);
  });

  it('will parse a file', async () => {
    const result = await parser.parseFile(
      fileFromString(TestXml),
      userFactory.createUser(owner),
    );
  });
});
