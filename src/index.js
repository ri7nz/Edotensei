/**
 * List of supported rel values List:
 *   'dns-prefetch',
 *   'prefetch',
 *   'preconnect',
 *   'preload', required as attributes
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
 * @var {string[]}
 */
const REL = ['dns-prefetch', 'prefetch', 'preconnect', 'preload']
export const duplicateScript = []
export const getType = (src) => {
  /*
   * @url https://regex101.com/r/iV3iM1/19
   */
  const regx = /\.(\w{2,3}($|\?))/m
  const [, type] = regx.exec(src) || [, null]
  return type
}

/**
 * @param {object} attributes
 * @param {string} type only "js" | "css" | "rel"
 * @return {element} element
 */
export const makeElement = (attributes, type) => {
  const element = (['css', 'rel'].includes(type) && document.createElement('link')) ||
                    (type === 'js' && document.createElement('script'))
  Object.assign(
    element,
    attributes
  )
  return element
}

export const makeAttribute = (attributes, type) => {
  let {id, src, async, defer} = attributes

  if (async && defer) {
    async = false
    defer = false
  }

  return (type === 'css' && {
    id,
    href: src,
    rel: 'stylesheet',
  }) || (type ==='js' && {
    id,
    src,
    async,
    defer,
  }) || {}
}

/**
 * Edotensei, A simple HTML script resource injector
 * @example
 * const elementList = [
 *   {
 *     src: 'url',
 *     async: boolean,
 *     defer: boolean,
 *     // rel attributes
 *     rel: 'preload|prefetch|dns-prefetch'
 *     // onload as callback after injected in dom
 *     onLoad: function,
 *   }
 * ];
 *
 * Edotensei.addScript(elementList)
 * Edotensei.removeScript(elementList)
 *
 * @typedef  {Object}  AttributeConfig
 * @property {string?} id
 * @property {string}  url
 * @property {boolean} async
 * @property {boolean} defer
 * @property {string}  rel
 * Should be <HTML:Link_types>, reference https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types
 */
export default class Edotensei {
  /**
   * Inject all of scripts into document.
   * Currently, it mutate and add `id` attribute
   * into ScriptConfig within scriptList
   * @param  {ScriptConfig[]} scriptList
   * @return {void}
   */
  static add(scriptList) {
    const duplicates = []
    scriptList.filter(
      (value, index, me) => {
        if (duplicates.includes(value.src)) {
          duplicateScript.push(value.src)
          return false
        }
        duplicates.push(value.src)
        return me.indexOf(value) === index
      }
    )
      .forEach(
        (script, key) => {
          script.id = `script:${key}`
          Edotensei.append(script)
        }
      )
  }

  /**
   * Remove injected scripts from document.
   * @param  {AttributeConfig[]} elementList
   * @return {void}
   */
  static remove(elementList) {
    elementList.forEach((script, key) => {
      const toRemove = document
        .getElementById(`script:${key}`)

      toRemove
        .parentNode
        .removeChild(toRemove)

      if (script.rel) {
        const relToRemove = document.getElementById(`script:${key}:rel`)
        relToRemove.parentNode.removeChild(relToRemove)
      }
    })
  }

  /**
   * Inject script into document.
   * @param  {AttributeConfig} attributes
   * @return {void}
   */
  static append(attributes) {
    const {id, src, rel, onLoad} = attributes

    const type = getType(src)

    const element = makeElement(
      makeAttribute(attributes, type),
      type
    )

    // if attributes rel has set
    if (rel && REL.includes(rel)) {
      const attributes = {
        href: src,
        rel,
        id: `${id}:rel`,
      }

      // Just Preload Rel have as attributes
      rel.toLowerCase() === 'preload' &&
            Object.assign(attributes, {
              as: (type==='js' && 'script') ||
                (type==='css' && 'style'),
            })
      document
        .head
        .appendChild(
          makeElement(
            attributes,
            'rel')
        )
    }

    onLoad &&
        typeof onload === 'function' &&
            Object.assign(element, {onload: onLoad})

    document[type === 'css' ? 'head' : 'body'].appendChild(element)
  }
}

export const add = Edotensei.add
export const remove = Edotensei.remove
