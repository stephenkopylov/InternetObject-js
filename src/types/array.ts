import ErrorCodes from '../errors/io-error-codes'
import { ParserTreeValue, Node } from '../parser/index'
import { Token } from '../parser'
import { isParserTree, isKeyVal, isString } from '../utils/is'
import MemberDef from './memberdef'
import TypeDef from './typedef'
import { TypedefRegistry } from './typedef-registry'
import { doCommonTypeCheck } from './utils'
import { isArray } from 'util'
import { isToken } from '../../../src-with-defs/utils/is'

// age?: { number, true, 10, min:10, max:20}

/**
 * Represents the `array`, performs following validations.
 * - Value is an array
 * - Value is optional
 * - Value is nullable
 * - array is <= schema.maxLength
 * - array is >= schema.minLength
 * - Value is in choices
 */
class ArrayDef implements TypeDef {
  private _keys: any = null

  public getType() {
    return 'array'
  }

  public parse = (data: ParserTreeValue, memberDef: MemberDef): any => {
    if (isParserTree(data)) {
      return _process('load', memberDef, data.values, data)
    } else if (data === undefined) {
      return _process('load', memberDef, undefined, data)
    }

    throw new Error('invalid-value')
  }

  public load = (data: any, memberDef: MemberDef): any => {
    const value = data === undefined ? undefined : data
    return _process('load', memberDef, value, data)

    // const validatedData = doCommonTypeCheck(memberDef)
    // if (validatedData !== data) return validatedData

    // if (!isArray(data)) throw new Error("invalid-value")

    // const schema = memberDef.schema

    // let typeDef:TypeDef | undefined

    // if (schema.type) {
    //   typeDef = TypedefRegistry.get(schema.type)
    // }
    // else {
    //   console.assert(false, "Invalid Case: Array schema must have a type attribute!")
    //   throw new Error("Verify this case!")
    // }

    // const array:any = []

    // data.forEach((item:any) => {
    //   if(typeDef !== undefined) {
    //     const value = typeDef.load(item, schema)
    //     array.push(value)
    //   }
    //   else {
    //     // TODO: Improve this error
    //     throw ErrorCodes.invalidType
    //   }
    // })

    // return array
  }
}

function _process(processingFnName: string, memberDef: MemberDef, value: any, node?: Node) {
  const validatedData = doCommonTypeCheck(memberDef, value, node)
  if (validatedData !== value) return validatedData

  if (!isArray(value)) throw new Error('invalid-value')

  const schema = memberDef.schema

  let typeDef: TypeDef | undefined

  if (schema.type) {
    typeDef = TypedefRegistry.get(schema.type)
  } else {
    console.assert(false, 'Invalid Case: Array schema must have a type attribute!')
    throw new Error('Verify this case!')
  }

  const array: any = []

  value.forEach((item: any) => {
    if (typeDef !== undefined) {
      const value = typeDef[processingFnName](item, schema)
      array.push(value)
    } else {
      // TODO: Improve this error
      throw ErrorCodes.invalidType
    }
  })

  return array
}

function _invlalidChoice(key: string, token: Token, min: number) {
  return [
    ErrorCodes.invalidMinValue,
    `The "${key}" must be greater than or equal to ${min}, Currently it is "${token.value}".`,
    token
  ]
}

function _invlalidMinLength(key: string, token: Token, min: number) {
  return [
    ErrorCodes.invalidMinValue,
    `The "${key}" must be greater than or equal to ${min}, Currently it is "${token.value}".`,
    token
  ]
}

function _invlalidMaxLength(key: string, token: Token, max: number) {
  return [
    ErrorCodes.invalidMaxValue,
    `The "${key}" must be less than or equal to ${max}, Currently it is "${token.value}".`,
    token
  ]
}

export default ArrayDef
