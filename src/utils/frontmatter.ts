import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { visit, SKIP } from 'unist-util-visit';
import type { MarkdownAstroData, RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';

// French spacing ("Here is how :") : the space before : ; ? ! becomes a no-break space, so
// the mark never starts a line on its own. Sources keep a plain space.
export const frenchSpacing = (text: string) => text.replace(/ ([:;?!]+)(?![\p{L}\p{N}])/gu, ' $1');

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    (file.data.astro as MarkdownAstroData).frontmatter.readingTime = readingTime;
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === 'element' && child.tagName === 'table') {
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        i++;
      }
    }
  };
};

export const lazyImagesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    visit(tree, 'element', function (node) {
      if (node.tagName === 'img') {
        node.properties.loading = 'lazy';
      }
    });
  };
};

export const frenchSpacingRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    visit(tree, function (node) {
      // Code keeps its spaces exactly as typed.
      if (node.type === 'element' && ['pre', 'code', 'kbd', 'samp', 'script', 'style'].includes(node.tagName)) {
        return SKIP;
      }
      if (node.type === 'text') {
        node.value = frenchSpacing(node.value);
      }
    });
  };
};
