////////////////////////////////////////
// GULPFILE.JS
////////////////////////////////////////

// TODO
//
// * make watch unbrokable (catch all errors without exiting)
// * split gulpfile into multiple subtasks files
// * jspm (or webpack/browserify at least)
// *
// * gulp-tap (tools)
// * gulp-plumber
// * gulp-cache/remember?
// * gulp-useref
// * gulp-notify (system notifications)
// * autodoc (js, scss)?
// * psi (PageSpeed Insights)
// * unit tests!
//
// ideas : https://github.com/osscafe/gulp-cheatsheet
// https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js

////////////////////////////////////////
// CONFIGURATION

global.config = {
  path: {
    src:    'src/',
		dist:   './',
		tmp:    '.tmp/',
		doc:    '.doc/',
		css:    'css/',
		scss:   'scss/',
		es:     'es6/',
		js:     'js/',
		img:    'img/',
		fonts:  'fonts/',
	},

	filesJs: [
		// "node_modules/jquery/dist/jquery.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/transition.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/collapse.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/affix.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/alert.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/button.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/carousel.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/modal.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/popover.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/scrollspy.js",
		// "node_modules/bootstrap-sass/assets/javascripts/bootstrap/tab.js",
		"src/es6/main.js"
	],

	serverport: 3000,
	openBrowser: false,
	openBrowsers: ["google chrome", "firefox"],
};

// PATHS

config.pathTmp =        config.path.src + config.path.tmp;
config.pathCssTmp =     config.pathTmp + config.path.css;
config.pathDoc =        config.path.src + config.path.doc;
config.pathStyleguide = config.pathDoc + "styleguide/";

// Build paths
config.pathEs =         [config.path.src + config.path.es + '**/*.js'];
config.pathScss =       [config.path.src + config.path.scss + '**/*.scss'];
config.pathSpritesSVG = [config.path.src + config.path.img + 'sprites/*.svg'];
config.pathImages =     [config.path.src + config.path.img + '*.*', '!' + config.pathSpritesSVG];
// config.pathHtml =       [config.path.src + '*.html', config.pathStyleguide + '*.html'];
config.pathHtml =       [config.path.src + '*.html'];

config.pathJsDest =     config.path.dist + config.path.js;
config.pathCssDest =    config.path.dist + config.path.css;
config.pathFontsDest =  config.path.dist + config.path.fonts;
config.pathImagesDest = config.path.dist + config.path.img;
config.pathClean =      [
	// config.path.dist,
	config.pathTmp + config.path.js,
	config.pathTmp + config.path.css
];


////////////////////////////////////////
// MODULES

var gulp =        	require('gulp'),
plugins =     	require('gulp-load-plugins')(),
browserSync = 	require('browser-sync'),
reload =      	browserSync.reload,
del =         	require('del'),
fs =     	    	require('node-fs'),
vinylPaths =  	require('vinyl-paths'),
autoprefixer = 	require('autoprefixer'),
styleguide = 		require('postcss-style-guide'),
runSequence  = 	require('run-sequence');

require('gulp-stats')(gulp);

////////////////////////////////////////
// INTERNAL TASKS

// UTILS

// Clean

gulp.task('clean', function () {
	return gulp.src(config.pathClean)
	.pipe(vinylPaths(del))
	.on('error', plugins.util.log);
});

// Copy

gulp.task('copy', ['copy-fonts']);

gulp.task('copy-fonts', function () {
	return gulp.src([
		'node_modules/font-awesome/fonts/*'
	])
	.pipe(gulp.dest(config.pathFontsDest))
	.on('error', plugins.util.log);
});


// IMAGES

gulp.task('images', function() {
	return gulp.src(config.pathImages)
	.pipe(plugins.newer(config.pathImagesDest))

	// prod
	.pipe(plugins.imagemin({
		progressive: true,  // jpeg
		interlaced: true,   // gif
		multipass: true,    // svg
		// svgoPlugins: [{removeViewBox: false}],
		// use: [pngquant()]
	}))
	.pipe(gulp.dest(config.pathImagesDest))
	.pipe(reload({stream: true}));
});

// SVG sprites

gulp.task('sprites', function() {
	return gulp.src(config.pathSpritesSVG)

	// prod
	.pipe(plugins.svgSprite({
		log: null,
		mode: {inline: true, symbol: true}
	}))
	.pipe(gulp.dest(config.path.src + config.path.img))
	.pipe(gulp.dest(config.pathImagesDest))
	.pipe(reload({stream: true}))
	.on('error', plugins.util.log);
});

gulp.task('sprites-reload', ['sprites'], reload);


// MARKUP

gulp.task('markup', function() {
	return gulp.src(config.pathHtml)

	// prod
	.pipe(plugins.processhtml())
	.pipe(plugins.minifyHtml())
	.pipe(gulp.dest(config.path.dist))
	.pipe(reload({stream: true}))
	.on('error', plugins.util.log);
});


// STYLES

gulp.task('styles', function() {

	return gulp.src([config.path.src + config.path.scss + 'main.scss'])
	.pipe(plugins.sassLint({'config': 'scsslint.yml'}))
	.pipe(plugins.sourcemaps.init())
	.pipe(plugins.sass({outputStyle: 'expanded'}))
	.pipe(plugins.postcss([
		autoprefixer({
			browsers: ['last 2 version']
		})
	]))
	.pipe(plugins.sourcemaps.write({sourceRoot: '.'}))
	.pipe(gulp.dest(config.pathTmp + config.path.css))
	.pipe(reload({stream: true}))

	// prod
	.pipe(plugins.minifyCss({
		keepSpecialComments: false,
		removeEmpty: true
	}))
	.pipe(plugins.rename({suffix: '.min'}))
	.pipe(gulp.dest(config.pathCssDest))
	.pipe(reload({stream: true}))
	.on('error', plugins.util.log);
});

// gulp.task('styleguide', function(){
//
// 	return gulp.src([config.pathCssTmp + 'main.css'])
// 	.pipe(plugins.postcss([
// 		styleguide({
// 			name: "Project name",
// 			dir: config.pathStyleguide,
// 			file: "index.html",
// 			// showCode: true,
// 			processedCSS: fs.readFileSync(config.pathCssTmp + 'main.css', 'utf-8'),
// 			// theme: "sassline"	// TODO BUG : themes not working
// 		})
// 	]))
// 	.pipe(reload({stream: true}))
// 	.on('error', plugins.util.log);
// });


// SCRIPTS

gulp.task('scripts', function() {
	return gulp.src(config.filesJs)
	.pipe(plugins.eslint())
	.pipe(plugins.eslint.format())
	//    .pipe(plugins.eslint.failAfterError())
	.pipe(plugins.sourcemaps.init())
	.pipe(plugins.babel({
		presets: ['es2015'],
		compact: false
	}))
	.pipe(plugins.concat('main.js'))
	.pipe(plugins.sourcemaps.write({sourceRoot: '.'}))
	.pipe(gulp.dest(config.pathTmp + config.path.js))

	// prod
	.pipe(plugins.rename({suffix: '.min'}))
	.pipe(plugins.uglify({outSourceMaps: false}))
	.pipe(gulp.dest(config.pathJsDest))
	.pipe(reload({stream: true}))
	.on('error', plugins.util.log);
});


// SERVER

gulp.task('serve', function() {
	browserSync({
		server: {
			baseDir: ['./'],
			routes: {
				"/dev": './' + config.path.src,
				// "/styleguide": './' + config.pathStyleguide,
				"/prod": './' + config.path.dist,
			},
			port: config.serverport
		},
		open: config.openBrowser,
		browser: config.openBrowsers,
		// notify: false,
		// Open the first browser window at URL + "/info.php"
		// startPath: "/info.php"
	});
});

// WATCH

gulp.task('watch', function () {
	gulp.watch(config.pathEs, ['scripts']);
	gulp.watch(config.pathScss, ['styles']);
	// gulp.watch(config.pathCssTmp + "main.css", ['styleguide']);
	gulp.watch(config.pathHtml, ['markup']);
	gulp.watch(config.pathImages, ['images']);
	gulp.watch(config.pathSpritesSVG, ['sprites-reload']);
});


////////////////////////////////////////
// USER TASKS

// gulp.task('style-n-guide', function() { runSequence('styles','styleguide');});
gulp.task('style-n-guide', ['styles']);
// gulp.task('compile', ['scripts', 'style-n-guide', 'markup']);
gulp.task('compile', ['scripts', 'markup']);
gulp.task('graphics', ['images', 'sprites']);
gulp.task('swatch', ['serve', 'watch']);

gulp.task('build', function() {
	runSequence(
		'clean',
		['compile', 'graphics']
		// 'swatch'
	);
});

gulp.task('default', ['swatch']);
