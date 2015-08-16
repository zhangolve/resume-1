var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var path = require('path');
var gls = require('gulp-live-server');

var server = gls.static('dist', 8000);

/**************** Utility **********************/
function highlight(str) {
  return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<strong>$1</strong>');
}

/******************* Jade to html ***********/
function getLocals() {
  var resumeData = require('./resume.json');
  var localePath = './i18n/' + resumeData.data_lang + '/dict.js';
  var locals = require(localePath);

  // remove cache
  delete require.cache[require.resolve('./resume.json')];
  delete require.cache[require.resolve(localePath)];

  // integrate the context
  for (var item in resumeData) {
    locals[item] = resumeData[item];
  }

  locals.highlight = highlight;

  return locals;
}

gulp.task('jade', function() {
  return gulp.src('./src/jade/index.jade')
    .pipe(plugins.jade({ locals: getLocals() }))
    .pipe(gulp.dest('./dist/'));
});

/************* less to css  ********************/
var lessPath = [path.join(__dirname, 'src', 'less', 'includes'),
                path.join(__dirname, 'src', 'less', 'components')];

function less2css(srcPath, destPath, debug) {
  if(!debug) {
    return gulp.src(srcPath)
      .pipe(plugins.less({ paths: lessPath }))
      .pipe(plugins.minifyCss({ compatibility: 'ie9' }))
      .pipe(gulp.dest(destPath));
  } else {
    return gulp.src(srcPath)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.less({ paths: lessPath }))
      .pipe(plugins.sourcemaps.write())
      .pipe(gulp.dest(destPath));
  }
}

gulp.task('less', function() {
  less2css('./src/less/questions.less', './dist/questions/');
  less2css('./src/less/index.less', './dist/');
});

gulp.task('less-debug', function() {
  less2css('./src/less/questions.less', './dist/questions/', true);
  less2css('./src/less/index.less', './dist/', true);
});

/************** Static assets **************/
gulp.task('static', function() {
  return gulp.src('./static/**/*', { base: 'static' })
    .pipe(gulp.dest('./dist/static/'));
});

/****************** Demos ****************/
gulp.task('demo', function() {
  return gulp.src('./interview/demo/**/*', {
      base: './interview/demo'
    })
    .pipe(gulp.dest('./dist/demo/'));
});

/****************** Questions ****************/
gulp.task('questions', function() {
  gulp.src('./node_modules/highlight.js/styles/tomorrow.css')
    .pipe(gulp.dest('./dist/questions/'));

  return gulp.src('./interview/questions/**.md')
    .pipe(plugins.markdown({
      highlight: function(code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    }))
    .pipe(plugins.layout({
      layout: './src/jade/layout/questions-layout.jade'
    }))
    .pipe(gulp.dest('./dist/questions/'));
});

/****************** Watch ****************/
gulp.task('watch', ['server'], function() {
  gulp.watch('./interview/demo/**/*', ['demo']);
  gulp.watch('./interview/questions/**/*', ['questions']);
  gulp.watch(['./src/**/*.jade', './resume.json', './i18n/**/*.js'],
             ['jade']);
  gulp.watch('./static/**/*', ['static']);
  gulp.watch('./src/**/*.less', ['less-debug']);
  gulp.watch('./dist/**/*', function() {
    server.notify.apply(server, arguments);
  });
});

/****************** Build ****************/
gulp.task('build', ['jade', 'less-debug', 'static', 'demo', 'questions']);
gulp.task('build-for-deploy', ['jade', 'less', 'static', 'demo', 'questions']);

/****************** Server ****************/
gulp.task('serve', function () {
  server.start();
});

gulp.task('server', ['build', 'serve']);
gulp.task('preview', ['build-for-deploy', 'serve']);

/****************** Deploy ****************/
gulp.task('deploy', ['build-for-deploy'], function() {
  return gulp.src('./dist/**/*')
    .pipe(plugins.ghPages());
});

/****************** Default ****************/
gulp.task('default', ['server', 'watch']);