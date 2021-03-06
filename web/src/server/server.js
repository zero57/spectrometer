import express from 'express';
import axios from 'axios';
import path from 'path'
import fs from 'fs'

import webpack from 'webpack';
import webpackConfig from '../../webpack.config';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import _ from 'lodash'
import moment from 'moment'
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { RouterContext, match } from 'react-router';
import { Provider } from 'react-redux';
import createLocation from 'history/lib/createLocation';
import injectTapEventPlugin from 'react-tap-event-plugin';

import packagejson from '../../package.json';
import configureStore from './store';
import routes from './routes';
import { loadProjectNames, loadBranches, loadCommits } from './api/data-initializer'
import { mapCommits } from './api/data-reducers'

console.log(`starting OpenDaylight Spectrometer web app in ${process.env.NODE_ENV} mode`)

const APP_CONFIG_FILE = './config/spectrometer-web.json'
const webAppConfig = JSON.parse(fs.readFileSync(path.resolve(APP_CONFIG_FILE), 'utf8'))

console.log("using configuration", webAppConfig)

const apiServerUrl = webAppConfig ? webAppConfig.apiServerUrl : 'http://localhost:5000'

global.navigator = { navigator: 'all' };
injectTapEventPlugin()


const app = express()

const startTime = moment()
let allProjects = []
loadProjectNames(apiServerUrl).then((names) => {
  console.info("server: project names loaded:", names.length )
  loadBranches(apiServerUrl, names).then((projectsWithBranches) => {
    console.info("server: project branches loaded:", projectsWithBranches.length)
    loadCommits(apiServerUrl, names).then((projectsWithCommits) => {
      allProjects = _.merge(projectsWithCommits, projectsWithBranches)
      console.log("server: it took ", moment().diff(startTime, 'seconds'), "seconds to load", allProjects.length, "projects")
      // console.log("ALL PROJECTS", JSON.stringify(allProjects, undefined, 2))
      console.log("server: all projects loaded into store, Spectrometer is READY for browsing")
    })
  })
})

const renderFullPage = (html, initialState) => {
  return (`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="description" content="OpenDaylight Spectrometer">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <meta name="keywords" content="OpenDaylight, Spectrometer"/>
        <title>OpenDaylight Spectrometer</title>

        <link rel="icon" type="image/x-icon" href="/static/images/favicon.ico">
        <link rel="stylesheet" type="text/css" href="/static/app.css">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
        </script>
        <script src="/static/bundle.js"></script>
      </body>
    </html>
  `);
}

if (process.env.NODE_ENV !== 'production') {
  console.info('using webpack dev middleware')
  console.info('process running from', __dirname)
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler, { noInfo: true, stats: { colors: true }, publicPath: webpackConfig.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
  app.use('/static', express.static(__dirname))
} else {
  app.use('/static', express.static(__dirname + '/../../dist'));
}

// handle all spectrometer-api requests
app.get('/spectrometer-api/*', function(req, res) {
  console.info('serving spectrometer-api url', req.url)
  const url = apiServerUrl + req.url.replace('spectrometer-api/', '')
  axios.get(url)
    .then(response => {
      req.url.indexOf('/git/commits') >= 0 ?
        res.json({commits: mapCommits(response.data.commits)}) :
        res.json(response.data)
    })
})

// handle non-api requests
app.get('/*', function(req, res, next) {
  console.info("serving url:", req.url)
  if ((/\.(gif|jpg|jpeg|tiff|png|ico|svg)$/i).test(req.url)) next()

  const location = createLocation(req.url);
  match({ routes, location }, (err, redirectLocation, renderProps) => {
    if (err) {
      console.error(err)
      return res.status(500).end('Internal server error')
    }

    if (!renderProps) {
      return res.status(404).end('Not found')
    }

    const store = configureStore({
      projects: {
        projects: allProjects
      }
    })

    const InitialView = (<Provider store={ store }>
      <RouterContext {...renderProps}/>
    </Provider>
    )

    const componentHTML = ReactDOMServer.renderToString(InitialView);
    const initialState = store.getState();
    res.status(200).end(renderFullPage(componentHTML, initialState))
  })
})

const server = app.listen(webAppConfig['httpPort'], function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`OpenDaylight Spectrometer web app listening at http://${host}:${port}`);
});
