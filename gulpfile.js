const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const postcssUrl = require("postcss-url");
const autoprefixer = require("autoprefixer");
const svgsprite = require("gulp-svg-sprite");
const rename = require("gulp-rename");
const sync = require("browser-sync").create();
const htmlmin = require ("gulp-htmlmin");
const imagemin = require ("gulp-imagemin");
const webp = require ("gulp-webp");
const terser = require("gulp-terser");
const del = require("del");
const ghPages = require('gh-pages');
const path = require('path');

// Styles

const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      postcssUrl({
        assetsPath: "../"
      }),
      autoprefixer()
    ]))
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}

exports.styles = styles;

// Svg stack

const svgstack = () => {
  return gulp.src("source/img/icons/**/*.svg")
    .pipe(plumber())
    .pipe(svgsprite({
      mode: {
        stack: {}
      }
    }))
    .pipe(rename("stack.svg"))
    .pipe(gulp.dest("build/img"));
}

exports.svgstack = svgstack;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Html

const html = () => {
  return gulp.src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
}

exports.html = html;

// Images

const optimizeImages = () => {
  return gulp.src([
      "source/img/**/*.{jpg,png,svg}",
      "!source/img/icons/**/*.svg",
      "!source/img/logo.svg"
    ])
    .pipe(imagemin([
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
}

exports.optimizeImages = optimizeImages;

const copyImages = () => {
  return gulp.src([
      "source/img/**/*.{jpg,png,svg}",
      "!source/img/icons/**/*.svg",
      "!source/img/logo.svg"
    ])
    .pipe(gulp.dest("build/img"));
}

exports.copyImages = copyImages;

// Scripts

const scripts = () => {
  return gulp.src("source/js/script.js")
    .pipe(terser())
    .pipe(rename("script.min.js"))
    .pipe(gulp.dest("build/js"))
    .pipe(sync.stream());
}

exports.scripts = scripts;

// WebP

const imagewebp = () => {
  return gulp.src([
      "source/img/**/*.{jpg,png}",
      "!source/img/favicon/**/*.*"
    ])
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"));
}

exports.imagewebp = imagewebp;

//Copy

const copy = (done) => {
  gulp.src([
    "source/fonts/*.{woff2,woff}",
    "source/*.ico",
    "source/*.webmanifest",
    "source/img/logo.svg"
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
  done();
}

exports.copy = copy;

// Clean

const clean = () => {
  return del("build");
}

exports.clean = clean;

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/img/icons/**/*.svg", gulp.series(svgstack, reload));
  gulp.watch("source/js/script.js", gulp.series(scripts, reload));
  gulp.watch("source/*.html", gulp.series(html, reload));
}

// Build

const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svgstack,
    imagewebp,
  ),
);

exports.build = build;



exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svgstack,
    imagewebp,
  ),
  gulp.series(
    server,
    watcher
  )
);


function deploy(cb) {
  ghPages.publish(path.join(process.cwd(), './build'), cb);
}
exports.deploy = deploy;
