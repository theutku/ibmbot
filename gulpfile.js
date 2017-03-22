var gulp = require('gulp');
var ts = require('gulp-typescript');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('tsc', function () {
    var tsProject = ts.createProject('tsconfig.json', {
        watch: false
    });
    var tsResult = tsProject.src()
        .pipe(tsProject());
    var result = tsResult.js.pipe(gulp.dest('bin'));

    return result;
});

gulp.task('server.dev', ['tsc'], function () {
    gulp.watch('./src/**/*.ts', ['tsc']);
});