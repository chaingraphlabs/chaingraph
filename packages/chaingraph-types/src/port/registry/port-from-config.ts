import type {
  AnyPort,
  ArrayPort,
  BooleanPort,
  EnumPort,
  NumberPort,
  ObjectPort,
  StringPort,
} from '@chaingraph/types'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import type { PortConfig } from '@chaingraph/types/port/types/port-composite-types'
import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  StreamInputPortConfig,
  StreamOutputPortConfig,
  StringPortConfig,
} from '@chaingraph/types/port/types/port-config'

export type PortFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? StringPort :
    C extends NumberPortConfig ? NumberPort :
      C extends BooleanPortConfig ? BooleanPort :
        C extends ArrayPortConfig<infer E> ? ArrayPort<E> :
          C extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            C extends AnyPortConfig ? AnyPort :
              C extends EnumPortConfig<infer E> ? EnumPort<E> :
                C extends StreamOutputPortConfig<infer T> ? StreamOutputPort<T> :
                  C extends StreamInputPortConfig<infer T> ? StreamInputPort<T> :
                    never
