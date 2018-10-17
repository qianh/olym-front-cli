const {prompt} = require('inquirer')
const program = require('commander')
const chalk = require('chalk')
const download = require('download-git-repo')
const ora = require('ora')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

const option =  program.parse(process.argv).args[0]
const defaultName = typeof option === 'string' ? option : 'react-project'
const tplList = require(`${__dirname}/../templates`)
const tplLists = Object.keys(tplList) || [];
const question = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name',
    default: defaultName,
    filter(val) {
      return val.trim()
    },
    validate(val) {
      const validate = (val.trim().split(" ")).length === 1
      return validate || 'Project name is not allowed to have spaces ';
    },
    transformer(val) {
      return val;
    }
  }, {
    type: 'list',
    name: 'template',
    message: 'Project template',
    choices: tplLists,
    default: tplLists[0],
    validate(val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  }, {
    type: 'input',
    name: 'description',
    message: 'Project description',
    default: 'React project',
    validate (val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  }, {
    type: 'input',
    name: 'author',
    message: 'Author',
    default: 'codering',
    validate (val) {
      return true;
    },
    transformer(val) {
      return val;
    }
  }, {
    type: 'input',
    name: 'port',
    message: 'Port',
    default: '7000',
    validate (val) {
      if(val.match(/\d{4}/g)) { // 校验位数
        return true;
      }
      return "请输入4位数字";
    },
    transformer(val) {
      return val;
    }
  }
]
module.exports = prompt(question).then(({name, template, description, author, port}) => {
  const projectName = name;
  const templateName = template;
  const gitPlace = tplList[templateName]['place'];
  const gitBranch = tplList[templateName]['branch'];
  const clone = tplList[templateName]['clone'];
  const changePom = tplList[templateName]['changePom'];
  const changeServerJson = tplList[templateName]['changeServerJson'];
  const spinner = ora('Downloading please wait...');
  spinner.start();
  download(`${gitPlace}${gitBranch}`, `./${projectName}`, {clone}, (err) => {
    if (err) {
      console.log(chalk.red(err))
      process.exit()
    }
    
    if(changePom) {
      // update pom.xml 
      fs.readFile(`./${projectName}/pom.xml`, 'utf8', function(err, data) {
        if(err) {
          spinner.stop();
          console.error(err);
          return;
        }
        const builder = new xml2js.Builder();  // JSON->xml
        const parser = new xml2js.Parser();  
        //xml -> json
        parser.parseString(data, function (err, result) {
          if(err) {
            spinner.stop();
            console.error(err);
            return;
          }
          result.project.artifactId = [projectName];
          result.project.build[0].finalName = [projectName];
          const xml = builder.buildObject(result);
          fs.writeFile(`./${projectName}/pom.xml`, xml, 'utf8', function (err) {
            if(err) {
              spinner.stop();
              console.error(err);
              return;
            } 
          });
        });
      });
    }

    if(changeServerJson) {
      // update server.json port
      fs.readFile(`./${projectName}/build/server.json`, 'utf8', function(err, data) {
        if(err) {
          spinner.stop();
          console.error(err);
          return;
        }
        const serverJson = JSON.parse(data);
        serverJson.port = parseInt(port);
        var updateServerJson = JSON.stringify(serverJson, null, 2);
        fs.writeFile(`./${projectName}/build/server.json`, updateServerJson, 'utf8', function (err) {
          if(err) {
            spinner.stop();
            console.error(err);
            return;
          } 
        });
      });
    }
    fs.readFile(`./${projectName}/package.json`, 'utf8', function (err, data) {
      if(err) {
        spinner.stop();
        console.error(err);
        return;
      }
      const packageJson = JSON.parse(data);
      packageJson.name = name;
      packageJson.description = description;
      packageJson.author = author;
      var updatePackageJson = JSON.stringify(packageJson, null, 2);
      fs.writeFile(`./${projectName}/package.json`, updatePackageJson, 'utf8', function (err) {
        if(err) {
          spinner.stop();
          console.error(err);
          return;
        } else {
          spinner.stop();
          console.log(chalk.green('project init successfully!'))
          console.log(`
            ${chalk.bgWhite.black('   Run Application  ')}
            ${chalk.yellow(`cd ${name}`)}
            ${chalk.yellow('yarn')}
            ${chalk.yellow('npm run dev')}
          `);
        }
      });
    });
  })
})
