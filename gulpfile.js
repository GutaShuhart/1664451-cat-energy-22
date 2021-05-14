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
const minify = require('gulp-minify');
const del = require('del');

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

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series("styles"));
  gulp.watch("source/img/icons/**/*.svg", gulp.series("svgstack"));
  gulp.watch("source/*.html").on("change", sync.reload);
}

// Html

const html = () => {
  return gulp.src("source/*.html")
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest("build"));
}

exports.html = html;

// Images

const optimizeImages = ()  => {
  return gulp.src("source/img/**/*.{jpg,png,svg}")
  .pipe(imagemin([
    imagemin.mozjpeg({quality: 75, progressive: true}),
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.svgo()
  ]))
  .pipe(gulp.dest("build/img"));
}

exports.optimizeImages = optimizeImages;

  const copyImages = ()  => {
    return gulp.src("source/img/**/*.{jpg,png,svg}")
   .pipe(gulp.dest("build/img"));
  }

exports.copyImages = copyImages;

// WebP

const imagewebp = ()  => {
  return gulp.src("source/img/**/*.{jpg,png}")
  .pipe(webp({quality:90}))
  .pipe(gulp.dest("build/img"));
}

exports.imagewebp = imagewebp;

//Js
const jsminify = ()  => {
  return gulp.src("source/**/*.js")
  .pipe(minify())
  .pipe(gulp.dest("build"));
}

exports.jsminify = jsminify;

//Copy

const copy = (done) => {
  gulp.src ([
    "source/fonts/*.{woff2,woff}",
    "source/*.ico",
    "source/*.webmanifest",
    "source/img/**/*.{jpg,png,svg}",
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
  done();
}

exports.copy = copy;

// Clean

const clean = (done) => {
  return del("build");
}

exports.clean = clean;


// Build

//const build = gulp.series ();
//exports.build = build;

exports.default = gulp.series(
  clean,
  copy,
  copyImages,
gulp.parallel(
  styles,
  html,
  jsminify,
  svgstack,
  imagewebp,
),
gulp.series(
  server,
  watcher
));
