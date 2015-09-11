var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var fs = require('fs');

gulp.task('clean', function() { return del('.dist') });

gulp.task('build:development', ['clean'], function() {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/dev.js')))
             .pipe($.smoosher())
             .pipe(gulp.dest('.dist'));
});

gulp.task('build:production', ['clean'], function() {
  return gulp.src('src/index.html')
             .pipe($.replace('/* insert:origins */', fs.readFileSync('./src/origins/prod.js')))
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

gulp.task('deploy:production', ['build:production'], function() {
  return gulp.src('.dist')
             .pipe($.ghPages());
});

gulp.task('deploy:development', ['build:development'], $.shell.task([
  'cd .dist',
  'git init',
  'git add .',
  'git commit -m "init"',
  'git remote add origin git@github.com:advancedkiosks/dev-zamok-auth-hub.git',
  'git push -u -f origin master'
]));
