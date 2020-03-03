const babel = require('gulp-babel');
const del = require('del');
const { src, dest, watch, series, parallel } = require('gulp');
const minifyCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const ghPages = require('gulp-gh-pages');
const postcss = require('gulp-postcss');
const rename = require("gulp-rename");
const sass = require('gulp-sass');
const sitemap = require('gulp-sitemap');
const stylelint = require('gulp-stylelint');
const uglify = require('gulp-uglify');
const fractal = require('./fractal.js');
const { spawn } = require('child_process');

// Public Tasks:

exports.default = series(sasswatch, criticalcss, parallel(jswatch, fractalstart, watcher));

exports.build = series(clean, sassbuild, criticalcss, scsslint, jslint, jsbuild, fractalbuild, pushassetslocal);

exports.deploy = series(clean, sassbuild, criticalcss, scsslint, jslint, jsbuild, fractalbuild, pushassetslocal, githubpages);

exports.test = series(settestenvironment, clean, sassbuild, criticalcss, scsslint, jslint, jsbuild, fractalbuild, makesitemap, startserver, runa11y, runpercy, stopserver, setdevenvironment);

exports.updatedev = series(pushassetsdev, gitpulldev);

exports.updatestage = series(pushassetsstage, gitpullstage);

exports.updateprod = series(pushassetsprod, gitpullprod);

// Fractal to Gulp Integration:

const logger = fractal.cli.console; // keep a reference to the fractal CLI console utility

function fractalstart() {
  const server = fractal.web.server({
    sync: true
  });
  server.on('error', err => logger.error(err.message));
  return server.start().then(() => {
    logger.success(`Fractal now running`);
  });
}

function fractalbuild(cb) {
  const builder = fractal.web.builder();
  builder.on('progress', (completed, total) => logger.update(`Exported ${completed} of ${total} items`, 'info'));
  builder.on('error', err => logger.error(err.message));
  return builder.build().then(() => {
    logger.success('Fractal build completed');
  })
  cb();
}

// General Tasks:

async function startserver() {
  return spawn('npm run starttestserver', {
    stdio: 'inherit',
    shell: true
  });
}

async function stopserver() {
  return spawn('npm run stoptestserver', {
    stdio: 'inherit',
    shell: true
  });
}

async function setdevenvironment() {
  return process.env.NODE_ENV = 'development';
}

async function settestenvironment() {
  return process.env.NODE_ENV = 'testing';
}

function clean(cb) {
  return del(['./dist/**', './ui-assets/css/sourcemaps'])
  cb();
}

function watcher(cb) {
  watch('./scss/*.scss', parallel(series(sasswatch, criticalcss), scsslint));
  watch('./js/*.js', parallel(jswatch, jslint));
  cb();
}

function sasswatch(cb) {
  return src('./scss/*.scss', { sourcemaps: true })
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss())
  .pipe(dest('./ui-assets/css', { sourcemaps: 'sourcemaps' }))
  cb();
}

function sassbuild(cb) {
  return src('./scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss())
  .pipe(minifyCSS())
  .pipe(dest('./ui-assets/css'))
  cb();
}

function criticalcss(cb) {
  return src('./ui-assets/css/critical.css')
  .pipe(rename('_criticalcss.hbs'))
  .pipe(dest('./elements/'))
  cb();
}

function scsslint(cb) {
  return src('./scss/*.scss')
  .pipe(stylelint({
    reporters: [
      {formatter: 'string', console: true}
    ]
  }));
  cb();
}

function jslint(cb) {
  return src(['./js/*.js'])
  .pipe(eslint())
  .pipe(eslint.format())
  cb();
}

function jswatch(cb) {
  return src('./js/*.js', { sourcemaps: true })
  .pipe(concat('main.js'))
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(dest('./ui-assets/js', { sourcemaps: true }))
  cb();
}

function jsbuild(cb) {
  return src(['./js/*.js'])
  .pipe(concat('main.js'))
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(uglify())
  .pipe(dest('./ui-assets/js'))
  cb();
}

function githubpages(cb) {
  return src('./dist/**/*')
  .pipe(ghPages())
  cb();
}

function runpercy(cb) {
  return spawn('npm run percy', {
    stdio: 'inherit',
    shell: true
  });
  cb();
}

function runa11y() {
  return spawn('npm run a11y', {
    stdio: 'inherit',
    shell: true
  });
}

function makesitemap() {
  return src('./dist/components/preview/*.html')
  .pipe(sitemap({
    siteUrl: 'http://localhost:8080/components/preview',
    noindex: true
  }))
  .pipe(dest('./dist'))
}

// Rsync Tasks:

function pullassetsdev() {
  return spawn('rsync -rvu cdlib@web-cdlib2x2-dev.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib/ui-assets ./', {
    stdio: 'inherit',
    shell: true
  });
}

function pushassetslocal() {
  return spawn('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets /Users/jhagedorn/Documents/cdlib-local/htdocs/wp-content/themes/cdlib', {
    stdio: 'inherit',
    shell: true
  });
}

function pushassetsdev() {
  return spawn('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-dev.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', {
    stdio: 'inherit',
    shell: true
  });
}

function pushassetsstage() {
  return spawn('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-stg-2a.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', {
    stdio: 'inherit',
    shell: true
  });
}

function pushassetsprod() {
  return spawn('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-prd-2a.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', {
    stdio: 'inherit',
    shell: true
  });
}

// // Server Git Pull Shell Tasks

function gitpulldev() {
  return spawn('ssh cdlib@web-cdlib2x2-dev.cdlib.org /apps/cdlib/bin/remote_git_pull_dev.sh', {
    stdio: 'inherit',
    shell: true
  });
}

function gitpullstage() {
  return spawn('ssh cdlib@web-cdlib2x2-stg-2a.cdlib.org /apps/cdlib/bin/remote_git_pull_stg.sh', {
    stdio: 'inherit',
    shell: true
  });
}

function gitpullprod() {
  return spawn('ssh cdlib@web-cdlib2x2-prd-2a.cdlib.org /apps/cdlib/bin/remote_git_pull_prd.sh', {
    stdio: 'inherit',
    shell: true
  });
}
