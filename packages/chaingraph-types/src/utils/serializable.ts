export interface ISerializable<TSerialized> {
  serialize: () => TSerialized
  deserialize: (data: TSerialized) => this
}
