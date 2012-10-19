var test = require('tap').test
var cp = require('child_process')
var npm = require('npm')
var path = require('path')
var fs = require('fs')
var async = require('async')
var cache = path.join(__dirname,'npmCacheDir')
var cacheGit = path.join(cache,'_git-remotes')

/* */

test('simple',function(t){
  npm.load({cache:cache},function(err){
    if (err) return t.end(err)
    var urls = [ 'git://github.com/isaacs/inherits.git'
               , 'git+https://github.com/isaacs/node-lru-cache.git'
               ]
    npm.commands.install(urls,function(err,data){
      t.ok(!err,'installing should work')
      findCachedDir(urls[0], function(err, dir){
        t.ok(!err,'properly installed inherits')
        findCachedDir(urls[1].slice(4), function(err, dir){
          t.ok(!err,'properly installed lru-cache')
          t.end()
        })
      }) 
    })
  })
})

/* */

test('make the cached git-dir invalid after installation '
    +'and install again',function(t){
  npm.load({cache:cache},function(err){
    if (err) return t.end(err)
    var urls = ['git://github.com/isaacs/node-lru-cache.git']
    npm.commands.install(urls,function(err,data){
      t.ok(!err,'installing should work')
      findCachedDir(urls[0], function(err, dir){
        t.ok(!err,'finding the cacheDir should work')
        var gitConfigPath = path.join(dir,'config')
        fs.unlink(gitConfigPath,function(err){
          if (err) return t.end(err)
          npm.commands.install(urls,function(err,data){
            t.ok(!err,'installing it again should work')
            t.end()  
          })
        })
      }) 
    })
  })
})

/* */

function findCachedDir(remote, cb) {
  fs.readdir(cacheGit,function(err,d){
    if (err) return cb(err)
    var result
    async.map(d,function(x,next){
      var dir = path.join(cacheGit,x)
      var child = cp.exec
        ( 'git config --get remote.origin.url'
        , {cwd:dir}, function(err,stdout,stderr){
            //console.log('WTF',(stdout+'\n'+stderr).trim())
            if (stdout.trim() == remote) result = dir
            next()
          } )
    },function(){
      if (!result) return cb(new Error('didnt find the directory'))
      cb(null, result)  
    })
  })
}
