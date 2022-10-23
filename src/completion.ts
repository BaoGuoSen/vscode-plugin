import * as fs from "fs";
import * as vscode from "vscode";

import getClass from './utils/getClass';
import readFileToArr from './utils/readFileToArr';

const path = require('path');

// 搜集类名的目标文件数组
const targetFiles: string[] = ['html', 'jsx', 'tsx', 'axml'];

function provideCompletionItems (
  document: vscode.TextDocument,
  position: vscode.Position
) {
  // 样式文件里的用户输入，用于判断是否是.
  const typeText = document
    .lineAt(position)
    .text.substring(position.character - 1, position.character);

  if (typeText !== '.') {
    return;
  }

  // 获取当前文件路径
  const filePath: string = document.fileName;
  // 获取当前文件夹路径
  const dir: string = path.dirname(filePath);
  // 读取当前文件夹下的所有文件名
  const files: string[] = fs.readdirSync(dir);

  // 筛选目标文件
  const target: string[] = files.filter((item: string) =>
    targetFiles.includes(item.split('.')[1])
  );

  // 样式文件通过.唤起的提示类名集合
  let classNames: string[] = [];

  // 读取目标文件，获取class
  target.forEach((item: string) => {
    const filePath: string = `${dir}/${item}`;

    classNames = getClass(filePath);
  });

  classNames = classNames.reduce((arr, ele) => {
    const className: string = ele.split('=')[1];
    // 去掉引号
    const field: string = className.slice(1, className.length - 1);
    // 处理多class情况
    if (ele.includes(' ')) {
      return arr.concat(field.split(' '));
    }

    arr.push(field);
    return arr;
  }, [] as string[]);

  // 针对有多个相同的class，先去重
  return [...new Set(classNames)].map( (ele: string) => {
    return new vscode.CompletionItem(
      /**
       * 提示内容要带上触发字符
       * @see https://github.com/Microsoft/vscode/issues/71662
       */
      `.${ele}`,
      vscode.CompletionItemKind.Text
    );
  });
}

//事件关闭后的回调
function resolveCompletionItem () {
  return null;
}

// 点击光标跳转部分
async function provideDefinition (
  document: vscode.TextDocument,
  position: vscode.Position
) {
  // 获取当前文件路径
  const filePath: string = document.fileName;
  // 获取当前文件夹路径
  const dir: string = path.dirname(filePath);
  // 当前光标所在单词
  const word = document.getText(document.getWordRangeAtPosition(position));
  // 当前光标所在行
  const line        = document.lineAt(position);

  const [startIndex, endIndex] = (() => {
    if (document.languageId === 'typescriptreact') {
      const startIndex = line.text.indexOf('className={') + 11;
      const endIndex = line.text.indexOf('}', startIndex);

      return [startIndex, endIndex];
    }

    const startIndex = line.text.indexOf('class="') + 7;
    const endIndex = line.text.indexOf('"', startIndex);

    return [startIndex, endIndex];
  })();

  let clickLineClassList = line.text.substring(startIndex,endIndex).split(" ");

  if (document.languageId === 'typescriptreact') {
    clickLineClassList = clickLineClassList.map(item => item.split('.')[1]);
  }

  //当前点击的单词不是个class名称
  if(!clickLineClassList.includes(word)) { return; }

  const fileContent = await fs.readdirSync(dir)
    .filter( v => ['css','less','scss','sass'].includes( v.substring(v.lastIndexOf(".") + 1 )))
    .reduce( async ( acc: any, url ) => {
      const fileUrl = `${dir}/${url}`;
      const resList: string[] = await readFileToArr(fileUrl);

      resList.forEach((lineData: string, index: number) => {
        // 针对不同的样式风格做兼容
        const className = lineData.match(/&.(\S*) {/) || lineData.match(/.(\S*) {/) || lineData.match(/.(\S*){/);

        className && acc.push({
          className: className[1].replace('.', ''),
          line: index + 1,
          filePath: fileUrl
        });
      });

      return acc;
    },[]);

  const toClassFileData = fileContent.find((item: { className: string }) => item.className === word);

  if (toClassFileData && fs.existsSync(toClassFileData.filePath)) {
    const { filePath, line } = toClassFileData;

    return new vscode.Location( vscode.Uri.file(filePath), new vscode.Position(line, 0) );
  }
}

export default function (context: vscode.ExtensionContext) {
  // 注册代码建议提示，只有当按下“.”时才触发
  context.subscriptions.push(
    //在当前文件内触发事件
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: 'file', language: 'css' },
        { scheme: 'file', language: 'less' },
        { scheme: 'file', language: 'scss' },
        { scheme: 'file', language: 'sass' },
      ],
      {
        provideCompletionItems,
        resolveCompletionItem,
      },
      //在上面这些文件输入 . 后触发事件
      "."
    ),
    vscode.languages.registerDefinitionProvider(
      [
        { scheme: 'file', language: 'html' },
        { scheme: 'file', language: 'axml' },
        { scheme: 'file', language: 'typescriptreact' }
        // { scheme: 'file', language: 'javascriptreact' }
      ],
      {
        provideDefinition
      }
    )
  );
}