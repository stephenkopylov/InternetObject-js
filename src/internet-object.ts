import Header from './header'
import DataParser from './data'
import Schema from './header/schema'
import ASTParser from './parser/ast-parser'
import ErrorCodes from './errors/io-error-codes'

import { isString } from './utils/is'
import { SCHEMA } from './parser/constants'
import { InternetObjectError } from './errors/io-error'

/**
 * Represents the InternetObject. A main facade class that
 * takes care of parsing, schema processing and other
 * core responsibilities.
 *
 * @public
 */
export class InternetObject<T = any> {
  /**
   * Initializes the new instance of the `InternetObject`
   * @param o {string, object} An internet object text or POJO which needs to be parsed or loaded
   * @param schema {string, Schema} An optional `Schema` object or its `string` representation
   */
  constructor(o: any, schema?: string | Schema) {
    let header: Header
    let data: any

    if (isString(o)) {
      const parsed = _parse(o, schema)
      header = parsed.header
      data = parsed.data
    } else {
      const parsed = _parseObject(o, schema)
      data = parsed.data
      header = parsed.header
    }
    this._data = data
    this._header = header
  }

  private _header: Header
  /**
   * Gets the header section of the object.
   */
  public get header(): Header {
    return this._header
  }

  /**
   * Gets the schema associated with the object.
   */
  public get schema() {
    return this._header.schema
  }

  public serialize(): string {
    //
    return ''
  }

  private _data: T
  /**
   * Gets the data section of the object
   */
  public get data(): T {
    return this._data
  }
}

function _serizlie(data: any, schema: Schema): string {
  return ''
}

function _getCompiledSchema(schema?: string | Schema) {
  if (!schema) return null

  if (schema instanceof Schema) {
    return schema
  }

  return Schema.compile(schema)
}

function _parseObject(o: any, schema?: string | Schema) {
  const compiledSchema = _getCompiledSchema(schema)

  if (compiledSchema === null) {
    return {
      data: o,
      header: new Header()
    }
  }

  return {
    data: compiledSchema.apply(o),
    header: new Header().set(SCHEMA, compiledSchema)
  }
}

// Parses the Internet Object string and returns the value
function _parse(text: string, schema?: string | Schema) {
  const parser = new ASTParser(text)

  let compiledSchema: Schema | null = null
  let compiledHeader: Header | null = null

  // Parse the text
  parser.parse()

  if (schema) {
    if (isString(schema)) {
      compiledSchema = Schema.compile(schema)
    } else if (schema instanceof Schema) {
      compiledSchema = schema
    } else {
      // TODO: Throw better error
      throw new InternetObjectError(ErrorCodes.invalidSchema)
    }
  }

  let header: Header
  if (parser.header) {
    header =
      compiledSchema === null
        ? Header.compile(parser.header)
        : Header.compile(parser.header, compiledSchema)

    compiledSchema = header.schema ? header.schema : compiledSchema
  } else {
    header = compiledSchema === null ? new Header() : new Header().set(SCHEMA, compiledSchema)
  }

  const data = compiledSchema ? compiledSchema.apply(parser.data) : DataParser.parse(parser.data)

  return { header, data }
}