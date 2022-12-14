
const reducer = (accumulator, curr) => accumulator + curr;

class Vector {
  constructor(...components) {
    this.components = components
  }

  add({ components }) {
    return new Vector(
      ...components.map((component, index) => this.components[index] + component)
    )
  }

  subtract({ components }) {
    return new Vector(
      ...components.map((component, index) => this.components[index] - component)
    )
  }

  //multiply
  scaleBy(number) {
    return new Vector(
      ...this.components.map(component => component * number)
    )
  }

  //magnitude
  length() {
  return Math.hypot(...this.components)
  }

  dotProduct({ components }) {
  return components.reduce((acc, component, index) => acc + component * this.components[index], 0)
  }

  crossProduct({ components }) {
    return new Vector(
      this.components[1] * components[2] - this.components[2] * components[1],
      this.components[2] * components[0] - this.components[0] * components[2],
      this.components[0] * components[1] - this.components[1] * components[0]
    )
  }

  //normalized
  normalize() {
  return this.scaleBy(1 / this.length())
  }
}


class Node extends Vector {
  constructor(...components){
    super(...components);
    //this.components = components
    this.id = -1
  }

  toString(){
    return `Node at ${this.components[0]}, ${this.components[1]}, ${this.components[2]}.`
  }
}

class Face {
  constructor(nodes = []) {
    this.nodes = nodes
  }

  add_node(n) {
		this.nodes.push(n)
	}

  get_centroid() {
    let num = this.nodes.length;
    //console.log(this.nodes, typeof(this.nodes))
    const x_values = this.nodes.map(n => n.components[0]);
    let avx = x_values.reduce(reducer) / num;
    const y_values = this.nodes.map(n => n.components[1]);
    let avy = y_values.reduce(reducer) / num;
    const z_values = this.nodes.map(n => n.components[2]);
    let avz = z_values.reduce(reducer) / num;
    return new Node(avx,avy,avz);
  }

  get_normal_of_length(l) {
    let fn = this.get_normal();
    let unit_normal = fn.normalize();
    return unit_normal.scaleBy(l)
  }

  get_normal() {
    let e1 = this.nodes[1].subtract(this.nodes[0]);
    let e2 = this.nodes[this.nodes.length - 1].subtract(this.nodes[0]);
    return e1.crossProduct(e2)
  }

  get_funky_point() {
    let cn = this.get_centroid()
    let betw = cn.subtract(this.nodes[0])
    let betw2 = betw.multiply(0.8)
    return this.nodes[0].addition(betw2)
  }

}

class Mesh {
  constructor() {
    this.nodes = [];
    this.faces = [];
  }

  add_face(f) {
    this.faces.push(f);
  }

  add_faces(facelist){
    this.faces.push(...facelist);
  }

  collect_nodes() {
    for (var f in this.faces) {
      for (var n in f.nodes) {
        if (n.id < 0) {
          this.nodes.push(n);
          n.id = this.nodes.length;
        }
      }
    }
  }
}

/*
class RulePyramid {
  replace(mesh, m) {
    const new_mesh = new Mesh();
    for (var f in mesh.faces) {
      let center_node = f.get_centroid();
      let scaled_normal = f.get_normal_of_length();
      let np = center_node.addition(scaled_normal);
      const new_node = new Node(np.components[0], np.components[1], np.components[2])
      for (var i = 0; i < f.nodes.length; i++) {
        let n1 = f.nodes[i];
        let n2 = f.nodes[(i+1) % f.nodes.length]
        const new_face = new Face([n1, n2, new_node])
        new_mesh.add_face(new_face)
      }
    }
    return new_mesh
  }
}
*/

class RulePyramid_v2 {
  constructor() {
  }
  replace(mesh, m, mod) {
    var new_mesh = new Mesh();
    for (var n = 0; n < mesh.faces.length; n++) {
      var f = mesh.faces[n];
        if (n % mod == 0) {
          var center_node = f.get_centroid();
          var scaled_normal = f.get_normal_of_length(m);
          var np = center_node.add(scaled_normal);
          var new_node = new Node(np.components[0], np.components[1], np.components[2]);
          for (var i = 0; i < f.nodes.length; i++) {
            var n1 = f.nodes[i];
            var n2 = f.nodes[(i+1) % f.nodes.length]
            var new_face = new Face([n1, n2, new_node])
            new_mesh.add_face(new_face)
          }
        } else {
          new_mesh.add_face(f);
        }
    }
    return new_mesh
  }
}

/*
class RuleTapered {
  replace(mesh, df=0.5, h=0, cap=true) {
    const new_mesh = new Mesh();
    for (var f in mesh.faces) {
      let center_node = f.get_centroid();
      let scaled_normal = f.get_normal_of_length(h);

      //calculate new node positions
      const new_nodes = [];
      for (var i = 0; i < f.nodes.length; i++) {
        var n1 = f.nodes[i];
        var betw = center_node.subtract(n1);
        betw = betw.scaleBy(df);
        var nn = n1.add(betw);
        nn = nn.add(scaled_normal);
        new_nodes.push(new Node(np.components[0], np.components[1], np.components[2]))
      }

      //create quads along edge
      for (var i = 0; i < f.nodes.length; i++) {
        var n1 = f.nodes[i];
        var n2 = f.nodes[(i+1) % f.nodes.length];
        var n3 = new_nodes[(i+1) % f.nodes.length];
        var n4 = new_nodes[i];
        const new_face = new Face([n1, n2, n3, n4])
        new_mesh.add_face(new_face)
      }

      if (cap) {
        var cap_face = new Face(new_nodes);
        new_mesh.add_face(cap_face);
      }
    }
    return new_mesh
  }
} */

class RuleTapered_v2 {
  constructor() {
  }
  replace(mesh, df=0.5, h=0, cap=true, mod=1) {
    var new_mesh = new Mesh();
    for (var n = 0; n < mesh.faces.length; n++) {
      var f = mesh.faces[n];
        //let n = mesh.faces.indexOf(f);
        if (n % mod == 0) {
          let center_node = f.get_centroid();
          let scaled_normal = f.get_normal_of_length(h);

          //calculate new node positions
          var new_nodes = [];
          for (var i = 0; i < f.nodes.length; i++) {
            var n1 = f.nodes[i];
            var betw = center_node.subtract(n1);
            betw = betw.scaleBy(df);
            var nn = n1.add(betw);
            nn = nn.add(scaled_normal);
            new_nodes.push(new Node(nn.components[0], nn.components[1], nn.components[2]))
          }

          //create quads along edge
          for (var i = 0; i < f.nodes.length; i++) {
            var n1 = f.nodes[i];
            var n2 = f.nodes[(i+1) % f.nodes.length];
            var n3 = new_nodes[(i+1) % f.nodes.length];
            var n4 = new_nodes[i];
            //console.log(n1, n2, n3, n4)
            var new_face = new Face([n1, n2, n3, n4])
            new_mesh.add_face(new_face)
          }

          if (cap) {
            var cap_face = new Face(new_nodes);
            new_mesh.add_face(cap_face);
          }
        } else {
          new_mesh.add_face(f);
        }
    }
    return new_mesh
  }
}

class Tetrahedron {
  constructor (cx=0, cy=0, cz=0, rad=1) {
    this.loc = new Vector(cx, cy, cz);
    this.rad = rad;
  }

  get_mesh() {
    const m = new Mesh();

    var rad = this.rad;

    const nodes = [];
    nodes.push(new Node(rad, rad, rad));
    nodes.push(new Node(-rad, -rad, rad));
    nodes.push(new Node(-rad, rad, -rad));
    nodes.push(new Node(rad, -rad, -rad));

    for (var i = 0; i < nodes.length; i++) {
      var vadd = nodes[i].add(this.loc);
      nodes[i] = new Node(vadd.components[0], vadd.components[1], vadd.components[2]);
    }

    m.add_face(new Face([nodes[2], nodes[1], nodes[0]]));
    m.add_face(new Face([nodes[0], nodes[3], nodes[2]]));
    m.add_face(new Face([nodes[1], nodes[3], nodes[0]]));
    m.add_face(new Face([nodes[2], nodes[3], nodes[1]]));

    return m
  }
}

class Octahedron {
  constructor (cx=0, cy=0, cz=0, a=1, b=1, c=1) {
    this.loc = new Vector(cx, cy, cz);
    this.a = a;
    this.b = b;
    this.c = c;
  }

  get_mesh() {
    const m = new Mesh();

    var ha = this.a/2.0;
    var hb = this.b/2.0;
    var h = this.c/Math.SQRT2;

    const nodes = [];
    nodes.push(new Node(-ha, 0, -hb));
    nodes.push(new Node(-ha, 0, hb));
    nodes.push(new Node(ha, 0, hb));
    nodes.push(new Node(ha, 0, -hb));
    nodes.push(new Node(0, h, 0));
    nodes.push(new Node(0, -h, 0));

    for (var i = 0; i < nodes.length; i++) {
      var vadd = nodes[i].add(this.loc);
      nodes[i] = new Node(vadd.components[0], vadd.components[1], vadd.components[2]);
    }

    m.add_face(new Face([nodes[0], nodes[1], nodes[5]]));
    m.add_face(new Face([nodes[3], nodes[0], nodes[5]]));
    m.add_face(new Face([nodes[2], nodes[3], nodes[5]]));
    m.add_face(new Face([nodes[1], nodes[2], nodes[5]]));
    m.add_face(new Face([nodes[1], nodes[0], nodes[4]]));
    m.add_face(new Face([nodes[0], nodes[3], nodes[4]]));
    m.add_face(new Face([nodes[3], nodes[2], nodes[4]]));
    m.add_face(new Face([nodes[2], nodes[1], nodes[4]]));

    return m
  }
}

class Hexahedron {
  constructor (cx=0, cy=0, cz=0, a=1, b=1, c=1) {
    this.loc = new Vector(cx, cy, cz);
    this.a = a;
    this.b = b;
    this.c = c;
  }

  get_mesh() {
    const m = new Mesh();

    var ha = this.a/2.0;
    var hb = this.b/2.0;
    var hc = this.c/2.0;
    const nodes = [];
    nodes.push(new Node(-ha, -hb, -hc));
    nodes.push(new Node(ha, -hb, -hc));
    nodes.push(new Node(ha, hb, -hc));
    nodes.push(new Node(-ha, hb, -hc));
    nodes.push(new Node(-ha, -hb, hc));
    nodes.push(new Node(ha, -hb, hc));
    nodes.push(new Node(ha, hb, hc));
    nodes.push(new Node(-ha, hb, hc));

    for (var i = 0; i < nodes.length; i++) {
      var vadd = nodes[i].add(this.loc);
      nodes[i] = new Node(vadd.components[0], vadd.components[1], vadd.components[2]);
    }

    m.add_face(new Face([nodes[3], nodes[2], nodes[1], nodes[0]]));
    m.add_face(new Face([nodes[4], nodes[5], nodes[6], nodes[7]]));
    m.add_face(new Face([nodes[0], nodes[1], nodes[5], nodes[4]]));
    m.add_face(new Face([nodes[2], nodes[3], nodes[7], nodes[6]]));
    m.add_face(new Face([nodes[1], nodes[2], nodes[6], nodes[5]]));
    m.add_face(new Face([nodes[4], nodes[7], nodes[3], nodes[0]]));

    return m
  }
}

class Dodecahedron {
  constructor (cx=0, cy=0, cz=0, rad=1) {
    this.loc = new Vector(cx, cy, cz)
    this.rad = rad
  }

  get_mesh() {
    const m = new Mesh();
    const phi = (1 + 5**0.5)/2.0;

    const nodes = [];

    nodes.push( new Node(1, 1, 1));
    nodes.push( new Node(1, 1, -1));
    nodes.push( new Node(1, -1, 1));
    nodes.push( new Node(1, -1, -1));
    nodes.push( new Node(-1, 1, 1));
    nodes.push( new Node(-1, 1, -1));
    nodes.push( new Node(-1, -1, 1));
    nodes.push( new Node(-1, -1, -1));

    nodes.push( new Node(0, -phi, -1/phi));
    nodes.push( new Node(0, -phi, 1/phi));
    nodes.push( new Node(0, phi,-1/phi));
    nodes.push( new Node(0, phi, 1/phi));

    nodes.push( new Node(-phi, -1/phi, 0));
    nodes.push( new Node(-phi, 1/phi, 0));
    nodes.push( new Node(phi, -1/phi, 0));
    nodes.push( new Node(phi, 1/phi, 0));

    nodes.push( new Node(-1/phi, 0, -phi));
    nodes.push( new Node(1/phi, 0, -phi));
    nodes.push( new Node(-1/phi, 0, phi));
    nodes.push( new Node(1/phi, 0, phi));

    for (var i = 0; i < nodes.length; i++) {
      var vadd = nodes[i].add(this.loc);
      vadd = vadd.normalize();
      vadd = vadd.scaleBy(this.rad);
      nodes[i] = new Node(vadd.components[0], vadd.components[1], vadd.components[2])
    }

    m.add_face(new Face([nodes[2], nodes[9], nodes[6], nodes[18], nodes[19]]));
    m.add_face(new Face([nodes[4], nodes[11], nodes[0], nodes[19], nodes[18]]));
    m.add_face(new Face([nodes[18], nodes[6], nodes[12], nodes[13], nodes[4]]));
    m.add_face(new Face([nodes[19], nodes[0], nodes[15], nodes[14], nodes[2]]));
    m.add_face(new Face([nodes[4], nodes[13], nodes[5], nodes[10], nodes[11]]));
    m.add_face(new Face([nodes[14], nodes[15], nodes[1], nodes[17], nodes[3]]));
    m.add_face(new Face([nodes[1], nodes[15], nodes[0], nodes[11], nodes[10]]));
    m.add_face(new Face([nodes[3], nodes[17], nodes[16], nodes[7], nodes[8]]));
    m.add_face(new Face([nodes[2], nodes[14], nodes[3], nodes[8], nodes[9]]));
    m.add_face(new Face([nodes[6], nodes[9], nodes[8], nodes[7], nodes[12]]));
    m.add_face(new Face([nodes[1], nodes[10], nodes[5], nodes[16], nodes[17]]));
    m.add_face(new Face([nodes[12], nodes[7], nodes[16], nodes[5], nodes[13]]));

    return m
  }
}

/*
class Lattice {
  constructor (stiffness, start_bounds) {
    this.stiffness = stiffness;
    this.start_bounds = start_bounds;
    this.centroid = null;
    this.nodes = [];
    this.repulsion_factor = 1.0;
  }
}*/


function objectsEqual(o1, o2) {
  const entries1 = Object.entries(o1);
  const entries2 = Object.entries(o2);
  if (entries1.length !== entries2.length) {
    return false;
  }
  for (let i = 0; i < entries1.length; ++i) {
    // Keys
    if (entries1[i][0] !== entries2[i][0]) {
      return false;
    }
    // Values
    if (entries1[i][1] !== entries2[i][1]) {
      return false;
    }
  }
  return true;
}

function mesh_to_gData(mesh) {
  var node_checklist = [] //Node Buffer
  var link_checklist = [] //Link Buffer
  var gData = {'nodes': [], 'links': [], 'mesh': []}
  var original_edge_lengths = []

  for (var i = 0; i < mesh.faces.length; i++) {
    var nl = mesh.faces[i].nodes.length;
    //console.log(mesh.faces[i].nodes.length)
    gData['mesh'].push([])
    for (var j = 0; j < nl; j++) {//iterate 3 times for triangles 4//for quads

      var nn = mesh.faces[i].nodes;
      var n = nn[j];

      if (!(node_checklist.includes(n))) {
        //[n.components[0],n.components[0],n.components[0]]
        node_checklist.push(n);
        gData['nodes'].push({'id':node_checklist.indexOf(n), 'connectivity': 0, 'visible':false, 'x':n.components[0],'y':n.components[1],'z':n.components[2]})
      }
      gData['mesh'][i].push(gData['nodes'][node_checklist.indexOf(n)]) //Addition for mesh face reference
    }
    for (var j = 0; j < nl; j++) {//iterate 3 times for triangles 4//for quads
      var nn = mesh.faces[i].nodes;
      var n = nn[j];

      var l
      var l_len
      if (j < nl-1) {
        l = [node_checklist.indexOf(n), node_checklist.indexOf(nn[j+1])]
        l_len  = ((n.components[0] - nn[j+1].components[0])**2 + (n.components[1] - nn[j+1].components[1])**2 + (n.components[2] - nn[j+1].components[2])**2)**0.5
      } else if (j == nl-1) {
        l = [node_checklist.indexOf(n), node_checklist.indexOf(nn[0])]
        l_len = ((n.components[0] - nn[0].components[0])**2 + (n.components[1] - nn[0].components[1])**2 + (n.components[2] - nn[0].components[2])**2)**0.5
      }
      //console.log(l)
      //Remove reversal and duplicates
      var a = JSON.stringify(link_checklist);
      var b = JSON.stringify(l);
      var c = a.indexOf(b)
      if (c == -1) {
      //if (!(link_checklist.includes(l))) {
        link_checklist.push(l);
        link_checklist.push([l[1], l[0]]); //Include reversed to checklist to omit in future
        gData['links'].push({'source':l[0], 'target': l[1], 'value': l_len, 'state': 0, 'visible':true})
        if (!(original_edge_lengths.includes(l_len))) {
          original_edge_lengths.push(l_len);
        }
        //Update connectivity counters
        gData['nodes'][l[0]]['connectivity'] ++
        gData['nodes'][l[1]]['connectivity'] ++
      }
    }
  }
  //console.log(gData)

  //Create connectivity layers
  var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  var mapped_nodes = []
  //var distance_quad = []
  //var unique_distances = []

  for (var i = 0; i < node_checklist.length; i++) {
    for (var j = 0; j < node_checklist.length; j++) {
      if (i != j) {
        var dist = ((node_checklist[i].components[0] - node_checklist[j].components[0])**2 + (node_checklist[i].components[1] - node_checklist[j].components[1])**2 + (node_checklist[i].components[2] - node_checklist[j].components[2])**2)**0.5
        /*
        if (!(unique_distances.includes(dist))) {
          unique_distances.push(dist)
        }*/
        //distance_quad.push(dist)
        mapped_nodes.push({link: [i, j], layer: dist})
      }
      else if (i == j) {
        j = node_checklist.length //skip upper quad when you reach
      }
    }
  }
  mapped_nodes.sort((a,b) =>  a.layer-b.layer) //sort ascending order
  gData['layers'] = groupBy(mapped_nodes, 'layer')
  //Consider renaming in sequence

  //Add links but with a number
  original_edge_lengths.sort(function(a, b) {
    return a - b;
  });
  gData['unique_edge_lengths'] = original_edge_lengths;
  //gData['link_layers'] = groupBy(gData['links'], 'value')

  return gData;
}
