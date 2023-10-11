import type { MergeParameters } from './versionedTypes'
export type { MergeParameters } from './versionedTypes'

/*
 *
 * Reselect Data Types
 *
 */

/**
 * A standard selector function, which takes three generic type arguments:
 * @param State The first value, often a Redux root state object
 * @param Result The final result returned by the selector
 * @param Params All additional arguments passed into the selector
 */
export type Selector<
  // The state can be anything
  State = any,
  // The result will be inferred
  Result = unknown,
  // There are either 0 params, or N params
  Params extends never | readonly any[] = any[]
  // If there are 0 params, type the function as just State in, Result out.
  // Otherwise, type it as State + Params in, Result out.
> = [Params] extends [never]
  ? (state: State) => Result
  : (state: State, ...params: Params) => Result

/** A function that Combines the input selectors and returns an output selector. Otherwise known as `resultFunc`. */
export type Combiner<Selectors extends SelectorArray, Result> = (
  ...resultFuncArgs: SelectorResultArray<Selectors>
) => Result

/** Selectors generated by Reselect have several additional fields attached: */
export interface OutputSelectorFields<
  Result = unknown,
  Selectors extends SelectorArray = SelectorArray,
  MemoizeFunction extends UnknownMemoizer = typeof defaultMemoize,
  ArgsMemoizeFunction extends UnknownMemoizer = typeof defaultMemoize
> extends Required<
    Pick<
      CreateSelectorOptions<MemoizeFunction, ArgsMemoizeFunction>,
      'argsMemoize' | 'memoize'
    >
  > {
  /** The final function passed to `createSelector` */
  resultFunc: Combiner<Selectors, Result>
  /** The same function, memoized */
  memoizedResultFunc: Combiner<Selectors, Result> &
    ExtractMemoizerFields<MemoizeFunction>
  /** Returns the last result calculated by the selector */
  lastResult: () => Result
  /** An array of the input selectors */
  dependencies: Selectors
  /** Counts the number of times the output has been recalculated */
  recomputations: () => number
  /** Resets the count of recomputations count to 0 */
  resetRecomputations: () => number
}

/**
 * Represents the actual selectors generated by `createSelector`.
 * The selector is:
 * - "a function that takes this state + params and returns a result"
 * - plus the attached additional fields
 */
export type OutputSelector<
  Result = unknown,
  Selectors extends SelectorArray = SelectorArray,
  MemoizeFunction extends UnknownMemoizer = typeof defaultMemoize,
  ArgsMemoizeFunction extends UnknownMemoizer = typeof defaultMemoize
> = OutputSelectorFields<
  Result,
  Selectors,
  MemoizeFunction,
  ArgsMemoizeFunction
> &
  ExtractMemoizerFields<ArgsMemoizeFunction> &
  Selector<
    GetStateFromSelectors<Selectors>,
    Result,
    GetParamsFromSelectors<Selectors>
  >

/**
 * A selector that is assumed to have one additional argument, such as
 * the props from a React component
 */
export type ParametricSelector<State, Props, Result> = Selector<
  State,
  Result,
  [Props, ...any]
>

/** A generated selector that is assumed to have one additional argument */
export type OutputParametricSelector<State, Props, Result> = ParametricSelector<
  State,
  Props,
  Result
> &
  OutputSelectorFields<Result, SelectorArray>

/** An array of input selectors */
export type SelectorArray = ReadonlyArray<Selector>

/** A standard function returning true if two values are considered equal */
export type EqualityFn = (a: any, b: any) => boolean

/*
 *
 * Reselect Internal Types
 *
 */

/** Extracts an array of all return types from all input selectors */
export type SelectorResultArray<Selectors extends SelectorArray> =
  ExtractReturnType<Selectors>

/** Determines the combined single "State" type (first arg) from all input selectors */
export type GetStateFromSelectors<S extends SelectorArray> =
  MergeParameters<S>[0]

/** Determines the combined  "Params" type (all remaining args) from all input selectors */
export type GetParamsFromSelectors<
  S extends SelectorArray,
  RemainingItems extends readonly unknown[] = Tail<MergeParameters<S>>
> = RemainingItems

/*
 *
 * Reselect Internal Utility Types
 *
 */

/** Any function with arguments */
export type AnyFunction = (...args: any[]) => any
/** Any function with unknown arguments */
export type UnknownFunction = (...args: unknown[]) => unknown
/** Any Memoizer function. A memoizer is a function that accepts another function and returns it. */
export type UnknownMemoizer<Func extends UnknownFunction = UnknownFunction> = (
  func: Func,
  ...options: any[]
) => Func

/**
 * Omit any index signatures from the given object type, leaving only explicitly defined properties.
 * Source: https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types/68261113#68261113
 * This is mainly used to remove explicit `any`s from the return type of some memoizers. e.g: `microMemoize`
 */
export type OmitIndexSignature<ObjectType> = {
  [KeyType in keyof ObjectType as {} extends Record<KeyType, unknown>
    ? never
    : KeyType]: ObjectType[KeyType]
}

/**
 * An if-else-like type that resolves depending on whether the given type is `never`.
 * This is mainly used to conditionally resolve the type of a `memoizeOptions` object based on whether `memoize` is provided or not.
 */
export type IfNever<T, TypeIfNever, TypeIfNotNever> = [T] extends [never]
  ? TypeIfNever
  : TypeIfNotNever

/** If `BaseType` is `never` fallback to `FallbackType` */
export type Fallback<BaseType, FallbackType> = IfNever<
  BaseType,
  FallbackType,
  BaseType
>

/** Derive the type of memoize options object based on whether the memoize function itself was overridden. */
export type OverrideMemoizeOptions<
  MemoizeFunction extends UnknownMemoizer,
  OverrideMemoizeFunction extends UnknownMemoizer = never
> = IfNever<
  OverrideMemoizeFunction,
  MemoizeOptsFromParams<MemoizeFunction>,
  MemoizeOptsFromParams<OverrideMemoizeFunction>
>

/** Extract memoize options from the parameters of a memoizer function. */
export type MemoizeOptsFromParams<MemoizeFunction extends UnknownMemoizer> =
  | DropFirst<Parameters<MemoizeFunction>>[0]
  | DropFirst<Parameters<MemoizeFunction>>

/** Extract the extra properties that are attached to the return value of a memoizer. e.g.: clearCache */
export type ExtractMemoizerFields<T extends UnknownMemoizer> =
  OmitIndexSignature<ReturnType<T>>

/** Extract the return type from all functions as a tuple */
export type ExtractReturnType<T extends readonly AnyFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? ReturnType<T[index]> : never
}

/** First item in an array */
export type Head<T> = T extends [any, ...any[]] ? T[0] : never
/** All other items in an array */
export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never

/** Extract only numeric keys from an array type */
export type AllArrayKeys<A extends readonly any[]> = A extends any
  ? {
      [K in keyof A]: K
    }[number]
  : never

export type List<A = any> = ReadonlyArray<A>

export type Has<U, U1> = [U1] extends [U] ? 1 : 0

/*
 *
 * External/Copied Utility Types
 *
 */

/**
 * The infamous "convert a union type to an intersection type" hack
 * Source: https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts
 * Reference: https://github.com/microsoft/TypeScript/issues/29594
 */
export type UnionToIntersection<Union> =
  // `extends unknown` is always going to be the case and is used to convert the
  // `Union` into a [distributive conditional
  // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
  (
    Union extends unknown
      ? // The union type is used as the only argument to a function since the union
        // of function arguments is an intersection.
        (distributedUnion: Union) => void
      : // This won't happen.
        never
  ) extends // Infer the `Intersection` type since TypeScript represents the positional
  // arguments of unions of functions as an intersection of the union.
  (mergedIntersection: infer Intersection) => void
    ? Intersection
    : never

/**
 * Assorted util types for type-level conditional logic
 * Source: https://github.com/KiaraGrouwstra/typical
 */
export type Bool = '0' | '1'
export type Obj<T> = { [k: string]: T }
export type And<A extends Bool, B extends Bool> = ({
  1: { 1: '1' } & Obj<'0'>
} & Obj<Obj<'0'>>)[A][B]

export type Matches<V, T> = V extends T ? '1' : '0'
export type IsArrayType<T> = Matches<T, any[]>

export type Not<T extends Bool> = { '1': '0'; '0': '1' }[T]
export type InstanceOf<V, T> = And<Matches<V, T>, Not<Matches<T, V>>>
export type IsTuple<T extends { length: number }> = And<
  IsArrayType<T>,
  InstanceOf<T['length'], number>
>

/**
 * Code to convert a union of values into a tuple.
 * Source: https://stackoverflow.com/a/55128956/62937
 */
type Push<T extends any[], V> = [...T, V]

type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never

// TS4.1+
export type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

/**
 * Converts "the values of an object" into a tuple, like a type-level `Object.values()`
 * Source: https://stackoverflow.com/a/68695508/62937
 */
export type ObjValueTuple<
  T,
  KS extends any[] = TuplifyUnion<keyof T>,
  R extends any[] = []
> = KS extends [infer K, ...infer KT]
  ? ObjValueTuple<T, KT, [...R, T[K & keyof T]]>
  : R

/** Utility type to infer the type of "all params of a function except the first", so we can determine what arguments a memoize function accepts */
export type DropFirstParameter<Func extends AnyFunction> = Func extends (
  firstArg: any,
  ...restArgs: infer Rest
) => any
  ? Rest
  : never

/**
 * Expand an item a single level, or recursively.
 * Source: https://stackoverflow.com/a/69288824/62937
 */
export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

type Identity<T> = T
/**
 * Another form of type value expansion
 * Source: https://github.com/microsoft/TypeScript/issues/35247
 */
export type Mapped<T> = Identity<{ [k in keyof T]: T[k] }>

/**
 * Fully expand a type, deeply
 * Source: https://github.com/millsp/ts-toolbelt (`Any.Compute`)
 */

type ComputeDeep<A, Seen = never> = A extends BuiltIn
  ? A
  : If2<
      Has<Seen, A>,
      A,
      A extends Array<any>
        ? A extends Array<Record<Key, any>>
          ? Array<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : A extends ReadonlyArray<any>
        ? A extends ReadonlyArray<Record<Key, any>>
          ? ReadonlyArray<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : { [K in keyof A]: ComputeDeep<A[K], A | Seen> } & unknown
    >

export type If2<B extends Boolean2, Then, Else = never> = B extends 1
  ? Then
  : Else

export type Boolean2 = 0 | 1

export type Key = string | number | symbol

export type BuiltIn =
  | Function
  | Error
  | Date
  | { readonly [Symbol.toStringTag]: string }
  | RegExp
  | Generator
