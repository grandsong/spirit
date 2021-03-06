import List from '../src/list/list'

describe('list', () => {

  it('should create an empty list', () => {
    expect(new List()).to.have.lengthOf(0)
  })

  it('should fail provide something else than array', () => {
    expect(() => new List({})).to.throw(/Items should be an array/)
  })

  it('should execute model with default args', () => {
    const sandbox = sinon.sandbox.create()
    const spy = sandbox.spy()

    class Model {
      constructor() { spy(...arguments) }

      toObject() {}
    }

    new List([], Model, [{ a: 1, b: 2 }, 12])

    expect(spy.calledOnce).to.be.true
    expect(spy.getCall(0).args).to.deep.equal([{ a: 1, b: 2 }, 12])
  })

  describe('Model', () => {

    it('should fail on invalid model', () => {
      class Model {}
      expect(() => new List([], Model)).to.throw(/model.toObject does not exist/)
    })

    it('should give list to model instances', () => {
      class Model { toObject() {} }
      Model.fromObject = (i) => new Model(i)

      const list = new List([new Model()], Model)
      expect(list.at(0)._list).to.equal(list)
      expect(list.add(new Model())._list).to.equal(list)

      list.add([{}, {}])
      expect(list.at(2)._list).to.equal(list)
      expect(list.at(3)._list).to.equal(list)
    })

  })

  describe('bubble events', () => {

    it('should setup bubble events', () => {
      class Model {
        toObject() {}

        setupBubbleEvents() {}
      }

      const a = new Model()
      const b = new Model()

      const spyA = sinon.spy(a, 'setupBubbleEvents')
      const spyB = sinon.spy(b, 'setupBubbleEvents')

      const list = new List([
        a,
        b
      ], Model)

      expect(spyA.calledOnce).to.be.true
      expect(spyB.calledOnce).to.be.true
    })

    it('should setup bubble events from object', () => {
      const spy = sinon.spy()

      class Model {
        toObject() {}

        setupBubbleEvents() {
          spy()
        }
      }
      Model.fromObject = () => new Model()

      new List([
        { a: 'a' },
        { b: 'b' }
      ], Model)

      expect(spy.calledTwice).to.be.true
    })

  })

  describe('parse on creation', () => {
    it('should contain a predefined list', () => {
      const list = new List([1, 2, 3])
      expect(list.list).deep.equal([1, 2, 3])
    })

    it('should parse list on model', () => {
      class Model { toObject() {} }

      const list = new List([new Model(), new Model()], Model)
      expect(list._model).equal(Model)
      expect(list).to.have.lengthOf(2)
      expect(list.at(0)).to.be.an.instanceOf(Model)
      expect(list.at(1)).to.be.an.instanceOf(Model)
    })

    it('should parse list on model.fromObject', () => {
      class Model { toObject() {} }
      Model.fromObject = (obj) => new Model()

      const list = new List([{ foo: 'bar' }, { bar: 'foo' }], Model)
      expect(list).to.have.lengthOf(2)
      expect(list.at(0)).to.be.an.instanceOf(Model)
      expect(list.at(1)).to.be.an.instanceOf(Model)
    })

    it('should fail when model could not be parsed', () => {
      class Model { toObject() {} }

      expect(() => new List([{ foo: 'bar' }, { bar: 'foo' }], Model))
        .to.throw(/Could not parse/)
    })
  })

  describe('list', () => {
    it('should get list', () => {
      const list = new List([{ x: 10 }, { y: 20 }])
      expect(list.list).to.deep.equal([{ x: 10 }, { y: 20 }])
    })

    it('should fail to set invalid list', () => {
      const list = new List()
      expect(() => list.list = null).to.throw(/List should be an array/)
      expect(() => list.list = {}).to.throw(/List should be an array/)
    })

    it('should set new list', () => {
      const params = new List()
      const list = []
      params.list = list
      expect(params.list).equal(list)
    })
  })

  describe('#at', () => {
    it('should fail on retrieve invalid index', () => {
      expect(() => new List([{ x: 10 }]).at(2)).to.throw(/Index exceeded/)
    })

    it('should return param by index', () => {
      expect(new List(['x', 'y']).at(0)).equal('x')
      expect(new List(['x', 'y']).at(1)).equal('y')
    })
  })

  describe('#add', () => {

    let list

    beforeEach(() => {
      list = new List()
    })

    it('should successfull add null to list without model', () => {
      list.add(null)
      list.add(undefined)
      expect(list.at(0)).equal(null)
      expect(list.at(1)).equal(undefined)
    })

    it('should fail on adding invalid item with model', () => {
      class Model { toObject() {} }
      list = new List([], Model)

      expect(() => list.add(null)).to.throw(/Invalid item/)
      expect(() => list.add(undefined)).to.throw(/Invalid item/)
      expect(() => list.add({})).to.throw(/Invalid item/)
      expect(list).to.have.lengthOf(0)
    })

    it('should add item of model instance', () => {
      class Model { toObject() {} }
      list = new List([], Model)
      list.add(new Model())
      list.add(new Model())

      expect(list).to.have.lengthOf(2)
      expect(list.at(0)).to.be.an.instanceOf(Model)
      expect(list.at(1)).to.be.an.instanceOf(Model)
    })

    it('should add by object from model', () => {
      class Model {
        constructor(obj) {
          Object.assign(this, obj)
        }

        toObject() {}
      }
      Model.fromObject = (obj) => new Model(obj)

      list = new List([], Model)
      expect(list).to.have.lengthOf(0)

      list.add({ x: 10 })
      list.add({ y: 100 })
      list.add({ z: 1000 })

      expect(list).to.have.lengthOf(3)

      expect(list.at(0)).to.be.an.instanceOf(Model)
      expect(list.at(0).x).equal(10)

      expect(list.at(1)).to.be.an.instanceOf(Model)
      expect(list.at(1).y).equal(100)

      expect(list.at(2)).to.be.an.instanceOf(Model)
      expect(list.at(2).z).equal(1000)
    })

    describe('array with model', () => {

      class Model {
        constructor(obj) {
          Object.assign(this, obj)
        }

        toObject() {}
      }
      Model.fromObject = (obj) => new Model(obj)

      beforeEach(() => {
        list = new List([], Model)
      })

      it('should add by array object', () => {
        list.add([
          { x: 10 },
          { y: 100 },
          { z: 1000 },
        ])

        expect(list.at(0)).to.be.an.instanceOf(Model)
        expect(list.at(0).x).equal(10)

        expect(list.at(1)).to.be.an.instanceOf(Model)
        expect(list.at(1).y).equal(100)

        expect(list.at(2)).to.be.an.instanceOf(Model)
        expect(list.at(2).z).equal(1000)
      })

      it('should add by array model instances', () => {
        list.add([
          new Model({ x: 10 }),
          new Model({ y: 100 }),
          new Model({ z: 1000 }),
        ])

        expect(list.at(0)).to.be.an.instanceOf(Model)
        expect(list.at(0).x).equal(10)

        expect(list.at(1)).to.be.an.instanceOf(Model)
        expect(list.at(1).y).equal(100)

        expect(list.at(2)).to.be.an.instanceOf(Model)
        expect(list.at(2).z).equal(1000)
      })

      it('should return added value', () => {
        expect(
          list.add({ a: 'b' })
        ).to.be.an.instanceOf(Model).and.have.property('a', 'b')

        const added = list.add([{ b: 'c' }, { c: 'd' }])
        expect(added).to.be.an('array')
        expect(added[0]).to.be.an.instanceOf(Model).and.have.property('b', 'c')
        expect(added[1]).to.be.an.instanceOf(Model).and.have.property('c', 'd')
      })

      it('should setup bubble events', () => {
        class Model {
          toObject() {}

          setupBubbleEvents() {}
        }

        list = new List([], Model)

        const m = new Model()
        const spy = sinon.spy(m, 'setupBubbleEvents')

        list.add(m)
        expect(spy.calledOnce).to.be.true
      })

    })
  })

  describe('#remove', () => {

    describe('no model', () => {

      let list

      beforeEach(() => {
        list = new List(['a', 'b', 'c', 'd'])
      })

      it('should remove a single value', () => {
        list.remove('a')
        expect(list.list).to.deep.equal(['b', 'c', 'd'])

        list.remove('c')
        expect(list.list).to.deep.equal(['b', 'd'])
      })

      it('should remove array of values', () => {
        list.remove(['a', 'c'])
        expect(list.list).to.deep.equal(['b', 'd'])
      })

      it('should remove array of number values', () => {
        list = new List([1, 2, 3, 4, 5])
        list.remove([3, 5])
        expect(list.list).to.deep.equal([1, 2, 4])
      })

      it('should return removed value', () => {
        expect(list.remove('c')).equal('c')
        expect(list.remove(['a', 'b', 'd'])).to.deep.equal(['a', 'b', 'd'])
      })
    })

    describe('with model', () => {

      let list

      class Model {
        constructor(obj) {
          this.obj = obj
        }

        toObject() {}
      }
      Model.fromObject = (i) => new Model(i)

      beforeEach(() => {
        list = new List([
          { a: 'b' },
          { b: 'c' },
          { c: 'd' },
          { d: 'e' }
        ], Model)
      })

      it('should have model instances with obj', () => {
        expect(list.list.map(i => i.obj)).to.deep.equal([
          { a: 'b' },
          { b: 'c' },
          { c: 'd' },
          { d: 'e' }
        ])
      })

      it('should remove model by instance', () => {
        const a = list.at(0)
        const c = list.at(2)

        list.remove(a)
        list.remove(c)

        expect(list.list.map(i => i.obj)).to.deep.equal([
          { b: 'c' },
          { d: 'e' }
        ])
      })

      it('should remove array of instances', () => {
        list.remove([
          list.at(0),
          list.at(2),
          list.at(3)
        ])
        expect(list.list.map(i => i.obj)).to.deep.equal([{ b: 'c' }])
        expect(list).to.have.lengthOf(1)
      })

      it('should return removed value', () => {
        expect(list.remove(list.at(0))).to.be.an.instanceof(Model).to.have.deep.property('obj.a', 'b')

        const removed = list.remove([list.at(0), list.at(2)])
        expect(removed).to.be.an('array')
        expect(removed[0]).to.be.an.instanceOf(Model).to.have.deep.property('obj.b', 'c')
        expect(removed[1]).to.be.an.instanceOf(Model).to.have.deep.property('obj.d', 'e')
      })
    })
  })

  describe('#clear', () => {

    let list,
        a, b, c, d

    class Model {
      constructor(obj) {
        this.obj = obj
      }

      toObject() {}
    }
    Model.fromObject = (i) => new Model(i)

    beforeEach(() => {
      list = new List([
        { a: 'b' },
        { b: 'c' },
        { c: 'd' },
        { d: 'e' }
      ], Model)

      a = list.at(0)
      b = list.at(1)
      c = list.at(2)
      d = list.at(3)
    })

    it('should have list for each item', () => {
      expect(a._list).equal(list)
      expect(b._list).equal(list)
      expect(c._list).equal(list)
      expect(d._list).equal(list)
    })

    it('should remove all items', () => {
      expect(list).to.have.lengthOf(4)
      list.clear()
      expect(list).to.have.lengthOf(0)

      expect(a._list).equal(null)
      expect(b._list).equal(null)
      expect(c._list).equal(null)
      expect(d._list).equal(null)
    })
  })

  describe('#each', () => {

    it('should create an immutable array', () => {
      const list = new List([1, 2, 3, 4])
      const length = list.length
      const spy = sinon.spy()

      list.each(item => {
        list.remove(item)
        spy()
      })

      expect(spy.callCount).equal(length)
    })

    it('should walk over each item', () => {
      const list = new List([1, 2, 3, 4])
      const spy = sinon.spy()

      list.each(spy)

      let calls = []
      for (let i = 0; i < spy.callCount; i++) {
        calls.push(spy.getCall(i).args[0])
      }

      expect(calls).to.deep.equal([1, 2, 3, 4])
    })

    it('should return mapped data', () => {
      expect(
        new List([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }]).each((item, i) => ({ b: item.a * i }))
      ).to.deep.equal([
        { b: 0 },
        { b: 2 },
        { b: 6 },
        { b: 12 }
      ])
    })

    it('should throw error when iteration failed and break the iteration', () => {
      const list = new List([1, 2, 3, 4])
      let count = 0

      const fn = () => list.each(i => {
        count = i
        if (i % 2 === 0) {
          throw new Error('no even numbers allowed')
        }
      })

      expect(fn).to.throw(/no even numbers allowed/)
      expect(count).to.equal(2)
    })

  })

  describe('#toObject', () => {
    it('should convert to readable object from primitives', () => {
      expect(new List([1, 2, 3, 4, 5]).toArray()).to.deep.equal([1, 2, 3, 4, 5])
      expect(new List([
        { a: 'a' },
        { b: 'b' }
      ]).toArray()).to.deep.equal([
        { a: 'a' },
        { b: 'b' }
      ])
    })

    it('should convert to readable object from model instances', () => {
      class Model {
        constructor(obj) {
          this.obj = obj
        }

        toObject() {
          return this.obj
        }
      }
      Model.fromObject = (i) => new Model(i)

      const list = new List([
        { a: 'a' },
        { b: 'b' },
        { c: 'c' }
      ], Model)

      const spyA = sinon.spy(list.at(0), 'toObject')
      const spyB = sinon.spy(list.at(1), 'toObject')
      const spyC = sinon.spy(list.at(2), 'toObject')

      const obj = list.toArray()

      expect(obj).to.deep.equal([{ a: 'a' }, { b: 'b' }, { c: 'c' }])
      expect(spyA.called).to.be.true
      expect(spyB.called).to.be.true
      expect(spyC.called).to.be.true
    })
  })

  describe('duplicates', () => {
    it('should fail with dups check on instance level', () => {
      const list = new List([1, 1])
      expect(() => list.duplicates = false).to.throw(/List has duplicates/)
    })

    it('should continue with no dups on instance level', () => {
      const list = new List([1, 2, 3])
      expect(() => list.duplicates = false).not.to.throw(/List has duplicates/)
      expect(list.duplicates).to.equal(false)
    })

    it('should fail with dups on property level', () => {
      const list = new List([
        { prop: 'x' },
        { prop: 'x' },
        { prop: 'z' },
      ])
      expect(() => list.duplicates = { prop: 'prop' }).to.throw(/List has duplicates/)
    })

    it('should continue with no dups on property level', () => {
      const list = new List([
        { prop: 'x' },
        { prop: 'y' },
        { prop: 'z' },
      ])
      expect(() => list.duplicates = { prop: 'prop' }).not.to.throw(/List has duplicates/)
    })

    it('should fail on adding duplicate', () => {
      const list = new List([
        { param: 'x', value: 10 },
        { param: 'y', value: 100 }
      ])
      list.duplicates = { prop: 'param' }
      expect(() => list.add({ param: 'x', value: 1000 })).to.throw(/List has duplicates/)
    })
  })

  describe('sort on', () => {
    it('should not sort list', () => {
      const list = new List([1, 4, 2])
      expect(list.toArray()).to.deep.equal([1, 4, 2])
    })

    it('should sort on primitives', () => {
      const list = new List([1, 4, 2])

      list.sortOn = true
      expect(list.sortOn).equal(true)

      expect(list.toArray()).to.deep.equal([1, 2, 4])

      list.add(3)
      expect(list.toArray()).to.deep.equal([1, 2, 3, 4])

      list.remove(2)
      expect(list.toArray()).to.deep.equal([1, 3, 4])
    })

    it('should sort on property', () => {
      const list = new List([
        { frame: 50 },
        { frame: 33 },
        { frame: 2 },
        { frame: 5 },
        { frame: 22 }
      ])

      list.sortOn = 'frame'

      expect(list.toArray()).to.deep.equal([
        { frame: 2 },
        { frame: 5 },
        { frame: 22 },
        { frame: 33 },
        { frame: 50 }
      ])

      list.add({ frame: 3 })
      expect(list.toArray()).to.deep.equal([
        { frame: 2 },
        { frame: 3 },
        { frame: 5 },
        { frame: 22 },
        { frame: 33 },
        { frame: 50 }
      ])
    })

    it('should sort on custom function', () => {
      const list = new List([
        { '10s': 10 },
        { '0.25s': 0.25 },
        { '1.467s': 1.467 },
        { '100.2s': 100.2 },
        { '000.2s': 0.2 }
      ])

      list.sortOn = (a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0])

      expect(list.toArray()).to.deep.equal([
        { '000.2s': 0.2 },
        { '0.25s': 0.25 },
        { '1.467s': 1.467 },
        { '10s': 10 },
        { '100.2s': 100.2 }
      ])
    })
  })

  describe('linked list', () => {

    let list

    beforeEach(() => {
      list = new List([
        { frame: 50 },
        { frame: 33 },
        { frame: 60 },
        { frame: 2 }
      ])

      list.sortOn = 'frame'
      list.linkedList = true
    })

    const assertLinkedListDescent = () => {
      for (let i = list.length - 1; i > -1; i--) {
        expect(list.at(i)).to.have.property('_prev', (i === 0) ? null : list.at(i - 1))
      }
    }

    const assertLinkedListAscent = () => {
      for (let i = 0; i < list.length; i++) {
        expect(list.at(i)).to.have.property('_next', (i === list.length - 1) ? null : list.at(i + 1))
      }
    }

    it('should link sorted list', () => {
      expect(list.linkedList).to.be.true
      assertLinkedListDescent()
      assertLinkedListAscent()
    })

    it('should iterate over linked list', () => {
      let f = list.at(0)
      let frames = []

      while (f) {
        frames.push(f.frame)
        f = f._next
      }
      expect(frames).to.deep.equal([2, 33, 50, 60])
    })

    it('should add and remove items and have reassigned prev and next', () => {
      list.remove(list.at(0))
      list.remove(list.at(0))
      list.add({ frame: 45 })
      list.add({ frame: 55 })
      list.add({ frame: 1 })
      list.remove(list.at(0))

      expect(list.list.map(i => i.frame)).to.deep.equal([45, 50, 55, 60])
      assertLinkedListDescent()
      assertLinkedListAscent()
    })

    it('should reassign prev and next for each item when adding items', () => {
      list.add({ frame: 45 })
      list.add({ frame: 55 })
      list.add({ frame: 1 })

      expect(list.list.map(i => i.frame)).to.deep.equal([1, 2, 33, 45, 50, 55, 60])
      assertLinkedListDescent()
      assertLinkedListAscent()
    })

    it('should reassign prev and next for each item when removing items', () => {
      list.remove(list.at(0))
      list.remove(list.at(1))

      expect(list.list.map(i => i.frame)).to.deep.equal([33, 60])
      assertLinkedListDescent()
      assertLinkedListAscent()
    })

    it('should clear prev and next on removal', () => {
      const removed = list.remove(list.at(0))
      expect(removed).not.to.have.property('_prev')
      expect(removed).not.to.have.property('_next')
    })

    it('should exclude prev and next from items in toArray()', () => {
      list.toArray().forEach(item => {
        expect(item).not.to.have.property('_prev')
        expect(item).not.to.have.property('_next')
      })

      assertLinkedListAscent()
      assertLinkedListDescent()
    })

    it('should fail to set linked list on primitives', () => {
      expect(() => list.list = [1, 2, 3, 4]).to.throw(/Can not link primitives/)
      expect(() => list.list = ['a', 'b', 'c', 'd']).to.throw(/Can not link primitives/)
    })

  })

  describe('iterable generator', () => {

    it('should be iterable', () => {
      let list = new List()
      expect(typeof list[Symbol.iterator] === 'function').to.be.true
    })

    it('should iterate over unsorted list', () => {
      let list = new List([
        { key: 'one' },
        { key: 'two' },
        { key: 'three' }
      ])

      let result = []
      for (let i of list) result.push(i)

      expect(result).to.deep.equal([
        { key: 'one' },
        { key: 'two' },
        { key: 'three' }
      ])

      expect(list[0]).to.deep.equal({ key: 'one' })
      expect(list[1]).to.deep.equal({ key: 'two' })
      expect(list[2]).to.deep.equal({ key: 'three' })
      expect([...list]).to.deep.equal([
        { key: 'one' },
        { key: 'two' },
        { key: 'three' }
      ])
    })

    it('should iterate over sorted list', () => {
      const list = new List([1, 4, 2])
      list.sortOn = true

      let result = []
      for (let i of list) result.push(i)

      expect(result).to.deep.equal([1,2,4])

      expect(result[0]).to.equal(1)
      expect(result[1]).to.equal(2)
      expect(result[2]).to.equal(4)
      expect([...result]).to.deep.equal([1, 2, 4])
    })

  })

  describe('dispatch changes', () => {

    let spy

    class Model {
      constructor(obj) {
        this.obj = obj
        Object.assign(this, obj)
      }

      toObject() {}
    }
    Model.fromObject = (obj) => new Model(obj)

    beforeEach(() => {
      spy = sinon.spy()
    })

    describe('add', () => {

      it('should listen for add events on primitive values', () => {
        const list = new List()
        list.on('add', spy)

        list.add(1)
        list.add([2, 3, 4])
        list.add(5)

        expect(spy.callCount).equal(5)

        let values = []
        for (let j = 0; j < spy.callCount; j++) {
          values.push(spy.getCall(j).args[0])
        }
        expect(values).to.deep.equal([1, 2, 3, 4, 5])
      })

      it('should listen for add events for objects with model', () => {
        const list = new List([], Model)
        list.on('add', spy)

        list.add({ a: 'b' })
        list.add({ b: 'c' })
        list.add([{ c: 'd' }, { d: 'e' }])

        expect(spy.callCount).equal(4)
        expect(spy.getCall(0).args[0]).to.be.an.instanceOf(Model).and.have.property('a', 'b')
        expect(spy.getCall(1).args[0]).to.be.an.instanceOf(Model).and.have.property('b', 'c')
        expect(spy.getCall(2).args[0]).to.be.an.instanceOf(Model).and.have.property('c', 'd')
        expect(spy.getCall(3).args[0]).to.be.an.instanceOf(Model).and.have.property('d', 'e')
      })
    })

    describe('remove', () => {
      it('should listen for remove primitives', () => {
        const list = new List([1, 2, 3, 4, 5])
        list.on('remove', spy)

        list.remove(2)
        list.remove([3, 4, 5])
        list.remove(1)

        expect(spy.callCount).equal(5)
        expect(spy.getCall(0).args[0]).equal(2)
        expect(spy.getCall(1).args[0]).equal(3)
        expect(spy.getCall(2).args[0]).equal(4)
        expect(spy.getCall(3).args[0]).equal(5)
        expect(spy.getCall(4).args[0]).equal(1)
      })

      it('should listen for remove events for objects with model', () => {
        const list = new List([
          { a: 'b' },
          { b: 'c' },
          { c: 'd' },
          { d: 'e' }
        ], Model)

        list.on('remove', spy)

        const a = list.at(0)
        const c = list.at(2)
        const d = list.at(3)

        list.remove(c)
        list.remove([a, d])

        expect(spy.callCount).equal(3)
        expect(spy.getCall(0).args[0]).to.be.and.instanceOf(Model).and.have.property('c', 'd')
        expect(spy.getCall(1).args[0]).to.be.and.instanceOf(Model).and.have.property('a', 'b')
        expect(spy.getCall(2).args[0]).to.be.and.instanceOf(Model).and.have.property('d', 'e')
      })
    })

  })

})
