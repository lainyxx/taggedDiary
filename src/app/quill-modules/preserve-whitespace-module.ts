import Quill from 'quill';


// https://github.com/slab/quill/issues/1752を参考に作成
export class PreserveWhiteSpace {
  constructor(private quill: any, private options: {}) {
    // エディタの container にスタイルを強制適用
    quill.container.style.whiteSpace = 'pre-wrap';
  }
}

// Quill にモジュールとして登録
Quill.register('modules/preserveWhiteSpace', PreserveWhiteSpace);