const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const svgsprite = require("gulp-svg-sprite");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const htmlmin = require("gulp-htmlmin");
const webp = require("gulp-webp");
const del = require("del");
const sync = require("browser-sync").create();
const terser = require("gulp-terser");

// Styles

const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}

exports.styles = styles;

// HTML

const html = () => {
  return gulp.src("source/*.html")
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest("build"));
}

exports.html = html;

// Scripts

// const scripts = () => {
//   return gulp.src("source/js/script.js")
//     .pipe(terser())
//     .pipe(rename("script.min.js"))
//     .pipe(gulp.dest("build/js"))
//     .pipe(sync.stream());
// }

// exports.scripts = scripts;

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

// Images

const optimizeImages = () => {
  return gulp.src(["source/img/**/*.{jpg,png,svg}", "!source/img/icons/**/*.svg"])
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
}

exports.images = optimizeImages;

const copyImages = () => {
  return gulp.src("source/img/**/*.{jpg,png,svg}", "!source/img/icons/**/*.svg")
    .pipe(gulp.dest("build/img"));
}

// WebP

const createWebp = () => {
  return gulp.src("source/img/**/*.{jpg,png}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"))
}

exports.createWebp = createWebp;

// Clean

const clean = () => {
  return del(["build/*/"])
}

exports.clean = clean;

//Copy

const copy = (done) => {
  gulp.src([
    "source/fonts/*.{woff2,woff}",
    "source/*.ico",
    "!source/img/icons/**/*.svg",
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"))
  done();
  }

  exports.copy = copy;

// Build

const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    // scripts,
    svgstack,
    createWebp
  ),
);

exports.build = build;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/img/icons/**/*.svg", gulp.series(svgstack, reload));
  gulp.watch("source/*.html", gulp.series(html, reload));
  // gulp.watch("source/js/*.js", gulp.series(scripts, reload));
}

//Default

exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    // scripts,
    svgstack,
    createWebp
  ),
  gulp.series(
    server,
    watcher
  )
);
