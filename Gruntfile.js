module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    compress: {
      build: {
        options: {
          archive: 'build.zip'
        },
        files: [
          {expand: true, cwd: './build', src: ['**'], dest: 'build'}
        ]
      }
    },
    run: {
      clean: {
        cmd: 'rm',
        args: ['-rf', './build']
      },
      mkdir: {
        cmd: 'mkdir',
        args: ['./build']
      },
      copyManifest: {
        cmd: 'cp',
        args: ['-f', './extension/manifest.prod.json', './build/manifest.json']
      },
      copyFiles: {
        cmd: 'cp',
        args: ['-rf', './extension/_locales', './extension/images', './build/']
      },
      runBg: {
        cmd: 'npm',
        args: [
          'run',
          'serve',
          '--prefix',
          './background/'
        ]
      },
      runPopup: {
        cmd: 'npm',
        args: [
          'run',
          'serve',
          '--prefix',
          './popup/'
        ]
      },
      buildBg: {
        cmd: 'npm',
        args: [
          'run',
          'build',
          '--prefix',
          './background/'
        ]
      },
      buildPopup: {
        cmd: 'npm',
        args: [
          'run',
          'build',
          '--prefix',
          './popup/'
        ]
      }
    },
    concurrent: {
      runAll: {
        tasks: ['run:runPopup', 'run:runBg'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.registerTask('clean', ['run:clean', 'run:mkdir']);
  grunt.registerTask('zip', ['compress:build']);
  grunt.registerTask('popup', ['run:runPopup']);
  grunt.registerTask('background', ['run:runBg']);
  grunt.registerTask('run-all', ['concurrent:runAll']);
  grunt.registerTask('build', ['clean', 'run:copyManifest', 'run:copyFiles', 'run:buildBg', 'run:buildPopup', 'zip']);
};