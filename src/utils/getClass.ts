const fs = require('fs');

const htmMatchRegex: RegExp = /class="[\w- ]+"/g;
const sxMatchRegex: RegExp = /className={styles.[\w- ]+}/g;

export default function getClass(path: string) {
  const data: string = fs.readFileSync(path, "utf8").split("\n").join("");
  // 文件后缀
  const fileExtension = path.substring(path.lastIndexOf('.') + 1);

  let result;
  // htm/html/vue-->class
  const classFileType = ['htm','html','vue','axml'];
  if ( classFileType.includes( fileExtension ) ) {
    result = data.match(htmMatchRegex);
  }

  const classNameFileType = ['tsx','jsx'];
  // tsx/jsx-->className
  if ( classNameFileType.includes(fileExtension) ) {
    result = data.match(sxMatchRegex);

    result = result?.map(item => {
      const temp = item.split('=')[1].split('.')[1]; // {styles.container}

      return `className="${temp.slice(0, temp.length - 1)}"`;
    });
  }

  return result || [];
}