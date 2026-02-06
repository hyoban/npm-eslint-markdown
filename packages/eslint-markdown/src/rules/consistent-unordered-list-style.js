/**
 * @fileoverview Rule to enforce consistent unordered list style.
 * @author hyoban
 */

// --------------------------------------------------------------------------------
// Import
// --------------------------------------------------------------------------------

import { URL_RULE_DOCS } from '../core/constants.js';

// --------------------------------------------------------------------------------
// Typedef
// --------------------------------------------------------------------------------

/**
 * @import { List, ListItem, Node } from 'mdast';
 * @import { RuleModule } from '../core/types.js';
 * @typedef {[{ style: 'consistent' | 'sublist' | '*' | '+' | '-' }]} RuleOptions
 * @typedef {'style'} MessageIds
 */

// --------------------------------------------------------------------------------
// Constant
// --------------------------------------------------------------------------------

const SUBLIST_MARKERS = ['*', '+', '-'];

// --------------------------------------------------------------------------------
// Rule Definition
// --------------------------------------------------------------------------------

/** @type {RuleModule<RuleOptions, MessageIds>} */
export default {
  meta: {
    type: 'layout',

    docs: {
      description: 'Enforce consistent unordered list style',
      url: URL_RULE_DOCS('consistent-unordered-list-style'),
      recommended: false,
      stylistic: true,
    },

    fixable: 'code',

    schema: [
      {
        type: 'object',
        properties: {
          style: {
            enum: ['consistent', 'sublist', '*', '+', '-'],
          },
        },
        additionalProperties: false,
      },
    ],

    defaultOptions: [
      {
        style: 'consistent',
      },
    ],

    messages: {
      style: 'Unordered list style should be `{{ style }}`.',
    },

    language: 'markdown',

    dialects: ['commonmark', 'gfm'],
  },

  create(context) {
    const { sourceCode } = context;
    const [{ style }] = context.options;

    /** @type {string | null} */
    let unorderedListStyle = style === 'consistent' ? null : style;

    /**
     * Get the depth of unordered list nesting for a list node.
     * @param {List} listNode The list node to check.
     * @returns {number} The depth of unordered list nesting (0 for top-level).
     */
    function getListDepth(listNode) {
      let depth = 0;
      /** @type {Node | undefined} */
      let current = sourceCode.getParent(listNode);

      while (current) {
        if (current.type === 'list' && /** @type {List} */ (current).ordered === false) {
          depth++;
        }
        current = sourceCode.getParent(current);
      }

      return depth;
    }

    return {
      // TODO: list[ordered=false] > listItem?
      listItem(node) {
        const parentList = /** @type {List} */ (sourceCode.getParent(node));

        // Skip ordered lists
        if (parentList.ordered) {
          return;
        }

        const [nodeStartOffset] = sourceCode.getRange(node);
        const currentUnorderedListStyle = sourceCode.text[nodeStartOffset];

        /** @type {string} */
        let expectedMarker;

        if (style === 'sublist') {
          const depth = getListDepth(parentList);
          expectedMarker = SUBLIST_MARKERS[depth % 3];
        } else if (style === 'consistent') {
          if (unorderedListStyle === null) {
            unorderedListStyle = currentUnorderedListStyle;
          }
          expectedMarker = unorderedListStyle;
        } else {
          expectedMarker = style;
        }

        if (expectedMarker !== currentUnorderedListStyle) {
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(nodeStartOffset),
              end: sourceCode.getLocFromIndex(nodeStartOffset + 1),
            },

            messageId: 'style',

            data: {
              style: expectedMarker,
            },

            fix(fixer) {
              return fixer.replaceTextRange(
                [nodeStartOffset, nodeStartOffset + 1],
                expectedMarker,
              );
            },
          });
        }
      },
    };
  },
};
