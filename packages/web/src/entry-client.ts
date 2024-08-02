import { PollingMode, getClient } from 'configcat-js';

import { Config } from './config';
import { createApp } from './main';
import './style.css';

const configCat = getClient(Config.configCatSdkKey, PollingMode.AutoPoll);
const { app } = createApp(configCat);

app.mount('#app');
