'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var modules = ['daynightoverlay', 'panomarker', 'simplemarker'];

gulp.task('minify', function(done) {
	modules.forEach(function(module) {
		var dir = './' + module + '/src/';

		gulp.src(dir + module + '.js')
			.pipe(uglify({ preserveComments: 'some' }))
			.pipe(rename(module + '.min.js'))
			.pipe(gulp.dest(dir));
	});

	done();
});

gulp.task('default', ['minify']);
