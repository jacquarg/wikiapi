
// take from https://www.npmjs.com/package/ftp-deploy

// usage : npm run deploymi -- USERNAME PASSWORD
//
// copy the content of source (in the current path), to destination (on the distant ftp path)
var source = __dirname + "/../build";
var destination = "/www/WordPress3/cartographies/wikiapi/";

var FtpDeploy = require('ftp-deploy');
var ftpDeploy = new FtpDeploy();

var userNPassword = process.argv.slice(-2)

var config = {
    username: userNPassword[0],
    password: userNPassword[1], // optional, prompted if none given
    host: "ftp.cluster015.ovh.net",
    port: 21,
    localRoot: source,
    remoteRoot: destination,
    include: [],
    exclude: ['.git', '.idea', 'tmp/*', 'node_modules/*']
}

ftpDeploy.on('uploading', function(data) {
    data.totalFileCount;       // total file count being transferred
    data.transferredFileCount; // number of files transferred
    data.percentComplete;      // percent as a number 1 - 100
    data.filename;             // partial path with filename being uploaded
});
ftpDeploy.on('uploaded', function(data) {
    console.log(data);         // same data as uploading event
});

ftpDeploy.deploy(config, function(err) {
    if (err) console.log(err)
    else console.log('finished');
});
