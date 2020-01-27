const babel = require('gulp-babel');
const del = require('del');
const { src, dest, watch, series, parallel } = require('gulp');
const minifyCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const ghPages = require('gulp-gh-pages');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const sassLint = require('gulp-sass-lint');
const uglify = require('gulp-uglify');
const fractal = require('./fractal.js');
const { spawn } = require('child_process');

// Public Tasks:

exports.default = parallel(sasswatch, jswatch, fractalstart, watcher);

exports.build = series(clean, sassbuild, scsslint, jslint, jsbuild, fractalbuild, pushassetslocal);

exports.deploy = series(clean, sassbuild, scsslint, jslint, jsbuild, fractalbuild, pushassetslocal, githubpages);

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

function clean(cb) {
  return del(['./dist/**', './ui-assets/css/sourcemaps'])
  cb();
}

function watcher(cb) {
  watch('./scss/*.scss', parallel(sasswatch, scsslint));
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

function scsslint(cb) {
  return src('./scss/*.scss')
  .pipe(sassLint({
    configFile: 'sass-lint-config.yml'
  }))
  .pipe(sassLint.format())
  .pipe(sassLint.failOnError())
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
