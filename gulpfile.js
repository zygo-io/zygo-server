var gulp = require('gulp');
var traceur = require('gulp-traceur');

var sources  = {
  jscode: 'lib/*.js',
};

gulp.task('default', function() {});

gulp.task('jscode', function() {
  return gulp.src(sources.jscode)
                .pipe(traceur()).on('error', logError)
                .pipe(gulp.dest('build'));
});

gulp.watch(sources.jscode, ['jscode']);

function logError(error) {
  console.warn(error);
  this.emit('end');
}
