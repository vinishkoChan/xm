import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIndexedDb, DBConfig } from 'ngx-indexed-db';

const dbConfig: DBConfig = {
  name: 'picsDb',
  version: 1,
  objectStoresMeta: [
    {
      store: 'pictures',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'url', keypath: 'url', options: { unique: false } },
        { name: 'blob', keypath: 'blob', options: { unique: false } },
      ],
    },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideIndexedDb(dbConfig),
    provideRouter(routes),
  ],
};
