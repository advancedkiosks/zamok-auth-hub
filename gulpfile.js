var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var fs = require('fs');
var runSequence = require('run-sequence');

gulp.task('clean', function() { return del('.dist') });

gulp.task('development:build', ['clean'], function() {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/dev.js')))
             .pipe($.jshint.extract('always'))
             .pipe($.jshint())
             .pipe($.jshint.reporter('default'))
             .pipe($.jshint.reporter('fail'))
             .pipe($.smoosher())
             .pipe(gulp.dest('.dist'));
});

gulp.task('production:build', ['clean'], function(cb) {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/prod.js')))
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
cnameTask('development');
cnameTask('staging');

gulp.task('production:deploy:gh', ['production:build:cname'], function() {
  return gulp.src('./.dist/**/*').pipe($.ghPages());
});

gulp.task('production:deploy', ['production:build'], function(cb) {
  return runSequence('production:deploy:gh', cb);
});

var gitDeploy = function(env) {
  return $.shell.task([
    'git init',
    'git add .',
    'git commit -m "init"',
    'git remote add origin ' + 'git@github.com:advancedkiosks/zamok-auth-hub-' + env + '.git',
    'git checkout -b gh-pages',
    'git push -u -f origin gh-pages'
  ], { cwd: '.dist' })
};

var deployTo = function(env) {
  return function(cb) {
    runSequence(env + ':build:cname', gitDeploy(env));
  };
};

gulp.task('staging:deploy', ['production:build'], deployTo('staging'));
gulp.task('development:deploy', ['development:build'], deployTo('development'));
