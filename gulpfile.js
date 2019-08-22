const del = require('del');
const { src, dest, watch, series, parallel } = require('gulp');
const minifyCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const sassJson = require('gulp-sass-json');
const sassLint = require('gulp-sass-lint');
const uglify = require('gulp-uglify');
const fractal = require('./fractal.js');
const { exec } = require('child_process');

// Public Tasks:

exports.default = parallel(sassbuild, fractalstart, watcher);

exports.build = series(clean, sassbuild, scsslint, jsbuild, fractalbuild, pushassetslocal);

exports.deploy = series(clean, sassbuild, fractalbuild, pushassetslocal, uploadlibrary);

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
  watch('./js/*.js', jswatch);
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

function sasstojson() {
  return src('./scss/_breakpoints.scss')
  .pipe(sassJson())
  .pipe(dest('./ui-assets/js')); // breakpoints.json
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

function jswatch(cb) {
  return src('./js/*.js', { sourcemaps: true })
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(dest('./ui-assets/js', { sourcemaps: true }));
}

function jsbuild(cb) {
  return src(['./js/*.js'])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(uglify())
  .pipe(dest('./ui-assets/js'));
}

// Rsync Tasks:

function uploadlibrary(cb) {
  return exec('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ webprod@webprod.cdlib.org:/apps/webprod/apache/htdocs/cdlib/cdlib-ui', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function pullassetsdev(cb) {
  return exec('rsync -rvu cdlib@web-cdlib2x2-dev.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib/ui-assets ./', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function pushassetslocal(cb) {
  return exec('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets /Users/jhagedorn/Documents/cdlib-local/htdocs/wp-content/themes/cdlib', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function pushassetsdev(cb) {
  return exec('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-dev.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function pushassetsstage(cb) {
  return exec('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-stg-2a.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function pushassetsprod(cb) {
  return exec('rsync -rvu --delete --exclude \'.DS_Store\' ./dist/ui-assets cdlib@web-cdlib2x2-prd-2a.cdlib.org:/apps/cdlib/apache/htdocs/wp-content/themes/cdlib', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

// // Server Git Pull Shell Tasks

function gitpulldev(cb) {
  return exec('ssh cdlib@web-cdlib2x2-dev.cdlib.org /apps/cdlib/bin/remote_git_pull_dev.sh', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function gitpullstage(cb) {
  return exec('ssh cdlib@web-cdlib2x2-stg-2a.cdlib.org /apps/cdlib/bin/remote_git_pull_stg.sh', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function gitpullprod(cb) {
  return exec('ssh cdlib@web-cdlib2x2-prd-2a.cdlib.org /apps/cdlib/bin/remote_git_pull_prd.sh', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}
