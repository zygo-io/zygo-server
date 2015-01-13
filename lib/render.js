import Jspm from 'jspm';
import React from 'react';
import * as zygo from './zygo-server';
import fs from 'fs';

export function renderComponent(component, title, state, clientRoutes) {
  let result = {
    zygoTitle: title,
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null
  };

  return Promise.resolve()
    .then(() => getBody(component, title))
    .then((body) => result.body = body)

    .then(() => getHeader())
    .then((header) => result.zygoHeader = header)

    .then(() => getFooter())
    .then((footer) => result.zygoFooter = footer)

    .then(() => result);
}

function getBody(component, title) {

}

function getHeader() {
  //TODO CSS TRACE
}

function getFooter() {

}
