class PlanarityCheker {
    constructor(matrix, size) {
        if (matrix !== undefined) {
            this.matrix = [...matrix];
            this.size = matrix.length;
        } else {
            this.size = size;
            this.matrix = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        }
        this.answer = undefined;
    }

    containsEdge(k, m) {
        return (this.matrix[k][m] === 1);
    }

    addEdge(k, m) {
        this.matrix[k][m] = 1;
        this.matrix[m][k] = 1;
    }

    findCycleDFS(res, used, parent, v) {
        used[v] = 1;
        for (let i = 0; i < this.matrix.length; i++) {
            if (i === parent || this.matrix[v][i] === 0) continue;
            if (used[i] === 0) {
                res.push(v);

                if (this.findCycleDFS(res, used, v, i)) return true;
                else res.pop();
            }
            if (used[i] === 1) {
                res.push(v);
                let cycle = [];
                for (let j = 0; j < res.length; j++) {
                    if (res[j] === i) {
                        cycle.concat(res.slice(j, res.length));
                        res = [...cycle];
                        return true;
                    }
                }
            }
        }
        used[v] = 2;
        return false;
    }

    getCycle() {
        let cycle = [];
        if (!this.findCycleDFS(cycle, new Array(this.matrix.length).fill(0), -1, 0)) {
            return undefined;
        } else {
            let res = [];
            for (const v of cycle) {
                res.push(v);
            }
            return res;
        }
    }

    dfsSegments(used, laidVerts, res, v) {
        used[v] = 1;
        for (let i = 0; i < this.matrix.length; i++) {
            if (this.matrix[v][i] === 1) {
                res.addEdge(v, i);
                if (used[i] === 0 && !laidVerts[i]) this.dfsSegments(used, laidVerts, res, i);
            }
        }
    }

    getSegments(laidVerts, edges) {
        let segments = [];
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = i + 1; j < this.matrix.length; j++) {
                if (this.matrix[i][j] === 1 && !edges[i][j] && laidVerts[i] && laidVerts[j]) {
                    let gr = new PlanarityCheker(undefined, this.size);
                    gr.addEdge(i, j);
                    segments.push(gr);
                }
            }
        }
        let used = new Array(this.size).fill(0);
        for (let j = 0; j < this.size; j++) {
            if (used[j] === 0 && !laidVerts[j]) {
                let res = new PlanarityCheker(undefined, this.size);
                this.dfsSegments(used, laidVerts, res, j);
                segments.push(res);
            }
        }
        return segments;
    }

    dfsChain(used, laidVerts, chain, v) {
        used[v] = 1;
        chain.push(v);
        for (let i = 0; i < this.size; i++) {
            if (this.matrix[v][i] === 1 && used[i] === 0) {
                if (!laidVerts[i])
                {
                    this.dfsChain(used, laidVerts, chain, i);
                }
                else chain.push(i);
                return;
            }
        }
    }


    getChain(laidVerts) {
        let res = [];
        for (let i = 0; i < this.size; i++) {
            if (laidVerts[i]) {
                let inGraph = false;
                for (let j = 0; j < this.size; j++) {
                    if (this.matrix[i][j] === 1) inGraph = true;
                }
                if (inGraph) {
                    this.dfsChain(new Array(this.size).fill(0), laidVerts, res, i);
                    break;
                }
            }
        }
        return res;
    }


    layChain(res, chain, cyclic) {
        for (let i = 0; i < chain.length - 1; i++) {
            res[chain[i]][chain[i + 1]] = true;
            res[chain[i + 1]][chain[i]] = true;
        }
        if (cyclic) {
            res[chain[0]][chain[chain.length - 1]] = true;
            res[chain[chain.length - 1]] [chain[0]] = true;
        }
    }

    isFaceContainsSegment(face, segment, laidVerts) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (segment.containsEdge(i, j)) {
                    if ((laidVerts[i] && face.indexOf(i) === -1) || (laidVerts[j] && face.indexOf(j) === -1)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }


    calcNumOfFacesContainedSegments(intFaces, extFace, segments, laidVerts, destFaces) {
        let count = new Array(segments.length).fill(0);
        for (let i = 0; i < segments.length; i++) {
            for (let j = 0; j < intFaces.length; j++) {
                if (this.isFaceContainsSegment(intFaces[j], segments[i], laidVerts)) {
                    destFaces[i] = [...intFaces[j]];
                    count[i]++;
                }
            }
            if (this.isFaceContainsSegment(extFace, segments[i], laidVerts)) {
                destFaces[i] = [...extFace];
                count[i]++;
            }
        }
        return count;
    }


    getPlanarLaying() {
        if (this.size === 1) {
            let faces = [];
            let outerFace = [];
            outerFace.push(0);
            faces.add(outerFace);
            return {innerFaces: faces, outerFace: outerFace};
        }
        let cycle = this.getCycle();
        if (cycle === undefined) return [];
        let intFaces = [];
        let extFace = [...cycle];
        intFaces.push(cycle);
        intFaces.push(extFace);
        let laidVerts = new Array(this.size).fill(false);
        let laidEdges = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        for (const c of cycle) {
            laidVerts[c] = true;
        }

        this.layChain(laidEdges, cycle, true);

let a = 0;
        while (true) {
            let segments = this.getSegments(laidVerts, laidEdges);
            if (segments.length === 0) break;
            let destFaces = new Array(segments.length).fill([]);
            let count = this.calcNumOfFacesContainedSegments(intFaces, extFace, segments, laidVerts, destFaces);
            let mi = 0;
            for (let i = 0; i < segments.length; i++) {
                if (count[i] < count[mi]) mi = i;
            }
            if (count[mi] === 0) return undefined;
            else {
                let chain = segments[mi].getChain(laidVerts);
                for (const c of chain) {
                    laidVerts[c] = true;
                }
                this.layChain(laidEdges, chain, true);
                let face = destFaces[mi];
                let face1 = [];
                let face2 = [];
                let contactFirst = 0, contactSec = 0;
                for (let i = 0; i < face.length; i++) {
                    if (face[i] === chain[0]) {
                        contactFirst = i;
                    }
                    if (face[i] === chain[chain.length - 1]) contactSec = i;
                }
                let reverseChain = [...chain];
                reverseChain.reverse();
                let faceSize = face.length;
                if (!arrayEquals(face, extFace)) {
                    if (contactFirst < contactSec) {
                        face1 = [...chain];
                        for (let i = (contactSec + 1) % faceSize; i !== contactFirst; i = (i + 1) % faceSize) {
                            face1.push(face[i]);
                        }
                        face2 = [...reverseChain];
                        for (let i = (contactFirst + 1) % faceSize; i !== contactSec; i = (i + 1) % faceSize) {
                            face2.push(face[i]);
                        }
                    } else {
                        face1 = [...reverseChain];
                        for (let i = (contactFirst + 1) % faceSize; i !== contactSec; i = (i + 1) % faceSize) {
                            face1.push(face[i]);
                        }
                        face2 = [...chain];
                        for (let i = (contactSec + 1) % faceSize; i !== contactFirst; i = (i + 1) % faceSize) {
                            face2.push(face[i]);
                        }
                    }
                    //intFaces = intFaces.filter(e => !arrayEquals(e, face));
                    intFaces.splice(intFaces.findIndex(e => arrayEquals(e, face)), 1);
                    intFaces.push([...face1]);
                    intFaces.push([...face2]);
                } else {
                    let newOuterFace = [];
                    if (contactFirst < contactSec) {
                        newOuterFace = [...chain];
                        for (let i = (contactSec + 1) % faceSize; i !== contactFirst; i = (i + 1) % faceSize) {
                            newOuterFace.push(face[i]);
                        }
                        face2 = [...chain];
                        for (let i = (contactFirst + 1) % faceSize; i !== contactSec; i = (i + 1) % faceSize) {
                            face2.push(face[i]);
                        }
                    } else {
                        newOuterFace = [...reverseChain];
                        for (let i = (contactFirst + 1) % faceSize; i !== contactSec; i = (i + 1) % faceSize) {
                            newOuterFace.push(face[i]);
                        }
                        face2 = [...chain];
                        for (let i = (contactSec + 1) % faceSize; i !== contactFirst; i = (i + 1) % faceSize) {
                            face2.push(face[i]);
                        }
                    }
                    //intFaces = intFaces.filter(e => !arrayEquals(e, extFace));
                    //intFaces.splice(intFaces.indexOf(extFace), 1);
                    intFaces.splice(intFaces.findIndex(e => arrayEquals(e, extFace)), 1);
                    intFaces.push([...newOuterFace]);
                    intFaces.push([...face2]);
                    extFace = [...newOuterFace];
                }
            }
        }
        this.answer = {innerFaces: intFaces, outerFace: extFace};
        return {innerFaces: intFaces, outerFace: extFace};

        function arrayEquals(a, b) {
            return Array.isArray(a) &&
                Array.isArray(b) &&
                a.length === b.length &&
                a.every((val, index) => val === b[index]);
        }
    }
}