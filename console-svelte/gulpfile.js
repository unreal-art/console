// import historyApiFallback from "connect-history-api-fallback"
import gulp from 'gulp'
import webserver from 'gulp-webserver'


// gulp.task('default', function() {
//   console.log('default task')
  
// });

gulp.task('start', function() {
  gulp.src('build')
    .pipe(webserver({
      dirname: "build",
      livereload: true,
      directoryListing: false,
      open: false,
      port: process.env.PORT || 8080,
      middleware: [
        // (e)=>{
        //   console.log(e)
        // },

        // historyApiFallback({
        //   index: '/',
        //   rewrites: [
        //     {
        //       // This regex matches any path that does not end with .html
        //       from: /^\/((?!.*\.html$).*)$/,
        //       // Appends .html to the matched path
        //       to: function(context) {
        //         return '/' + context.match[1] + '.html';
        //       },
        //     },
        //   ],
        // }),

        function(req, res, next) {

          if (req.url === '/') {
            // console.log('is home')
            return next(); // Skip to the next middleware without modifying the request
          }

          // Check if the Accept header prefers HTML content
          const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

          // Only proceed with rewriting if the request prefers HTML content
          if (acceptsHtml) {
            // Check if the request URI does not end with .html
            if (!/\.[^.]+$/.test(req.url)) { // Simple check to see if there's no file extension
              // Append .html to the request URL
              req.url += '.html';
            }
          }
          
          // Call next middleware in the stack
          next();
        },
      ],
    }));
});

gulp.task('default', gulp.series('start'))
