var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var fs = require('fs');
var runSequence = require('run-sequence');

gulp.task('clean', function() { return del('.dist') });

gulp.task('staging:build', ['clean'], function() {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/staging.js')))
             .pipe($.jshint.extract('always'))
             .pipe($.jshint())
             .pipe($.jshint.reporter('default'))
             .pipe($.jshint.reporter('fail'))
             .pipe($.smoosher())
             .pipe(gulp.dest('.dist'));
});

gulp.task('production:build', ['clean'], function(cb) {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/production.js')))
             .pipe($.jshint.extract('always'))
             .pipe($.jshint())
             .pipe($.jshint.reporter('default'))
             .pipe($.jshint.reporter('fail'))
             .pipe($.smoosher())
             .pipe($.htmlmin({
               collapseWhitespace: true,
               minifyJS: true,
               removeComments: true,
               removeCommentsFromCDATA: true,
               removeRedundantAttributes: true,
               removeAttributeQuotes: true,
               useShortDoctype: true,
               removeOptionalTags: true
             }))
             .pipe(gulp.dest('.dist'));
});

var cnameTask = function(env) {
  gulp.task(env+':build:cname', function() {
    return gulp.src('src/cname/' + env)
               .pipe($.rename('CNAME'))
               .pipe(gulp.dest('.dist'));
  });
}
cnameTask('production');
cnameTask('staging');


var gitDeploy = function(env) {
  const origin = {
    staging: 'git@github.com:advancedkiosks/zamok-auth-hub-staging.git',
    production: 'git@github.com:advancedkiosks/zamok-auth-hub.git',
  };
  return $.shell.task([
    'git init',
    'git add .',
    'git commit -m "init"',
    'git remote add origin ' + origin[env],
    'git checkout -b gh-pages',
    'git push -u -f origin gh-pages'
  ], { cwd: '.dist' })
};

var deployTo = function(env) {
  return function(cb) {
    runSequence(env + ':build:cname', gitDeploy(env));
  };
};

gulp.task('production:deploy', ['production:build'], deployTo('production'));
gulp.task('staging:deploy', ['staging:build'], deployTo('staging'));
