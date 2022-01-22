function getCurve(from, to) {
    return layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) !== undefined ?
        layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) :
        layer.findOne(`#line_${to}_${from}_${nodes.get(from).get(to).length - 1}`)
}

function paintPath(path, isSaving = true, text) {
    alerting(text + path)

    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('red')
    }

    if (isSaving)
        save(path, "Сохранить путь")
}

function returnDefaultPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('blue')
    }
}

function paintCommand(path, isSaving = true, text = "Путь: ") {
    addHistoryCommand({
        undo: () => {
            alerting('')
            returnDefaultPath(path)
        },
        redo: () => {
            paintPath(path, isSaving, text)
        }
    }).redo()
}

function save(text, message = "Сохранить данные") {
    showSaveButton(message, text)
}

async function saveFile(text) {
    let handle = await window.showSaveFilePicker()
    let stream = await handle.createWritable()
    await stream.write(text)
    await stream.close()
    hideSaveButton()
}

function getAdjMatrix() {
    let matrix = Array(nodes.size).fill(null).map(() => Array(nodes.size).fill(0))
    /*for (let i = 1; i < trs.length; i++) {
        matrix.push([])
        for (let j = 1; j < trs[i].cells.length; j++) {
            matrix[i - 1].push(parseInt(trs[i].cells[j].textContent))
        }
    }*/

    for (let [node1, nodes1] of nodes) {
        for (let [node2, weights] of nodes1) {
            matrix[node1][node2] = weights[0]
        }
    }

    return matrix
}

function getAdjLists() {
    let matrix = []
    for (let nodes1 of nodes.values()) {
        let list = []
        for (let node2 of nodes1.keys())
            list.push(node2)

        matrix.push(list)
    }

    return matrix
}

function getMapEdges(nodess) {
    let graph = new Map()
    for (let [node1, nodes1] of nodess) {
        graph.set(node1, [])
        for (let [node2, weights] of nodes1)
            graph.get(node1).push({
                to: node2,
                cost: weights[0]
            })
    }

    return graph
}

async function generate() {
    function randomInt(max) {
        return Math.floor(Math.random() * max)
    }

    let count = prompt("Введите количество вершин", "1")
    let matrix = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        matrix[i] = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        for (let j = i + 1; j < count; j++)
            if (randomInt(101) > 60) {
                matrix[i][j] = matrix[j][i] = 1
            }

    let handle = await window.showSaveFilePicker()
    let stream = await handle.createWritable()
    stream.write(" ")
    for (let i = 0; i < count; i++) {
        stream.write(" " + i)
    }

    stream.write("\r\n")

    for (let i = 0; i < matrix.length; i++) {
        stream.write(i)
        let text = ''
        for (let j = 0; j < matrix.length; j++) {
            text += " " + matrix[i][j]
        }

        stream.write(text)

        if (i !== matrix.length - 1)
            stream.write("\r\n")
    }

    stream.close()
}

function startEndPathPaint(procedure) {
    clear()
    let start = prompt("Введите начальную вершину", '0')
    let end = prompt("Введите конечную вершину", '0')
    start = getId(start)
    end = getId(end)
    let path = procedure(start, end)

    if (path !== undefined)
        paintCommand(path)
}

function bfs(start, end) {
    clear()
    let queue = [], visited = [], d = [Array(nodes.size).fill(0)], p = [Array(nodes.size).fill(0)]
    queue.push(start)
    visited.push(start)
    p[start] = -1

    while (queue.length > 0) {
        let v = queue.shift()
        for (let [neighbor, weight] of nodes.get(v)) {
            if (weight[0] !== 0 && !visited.includes(neighbor)) {
                queue.push(neighbor)
                visited.push(neighbor)
                d[neighbor] = d[neighbor] + 1
                p[neighbor] = v
            }
        }
    }

    if (!visited.includes(end)) {
        alert(`От вершины ${start} нет пути до вершины ${end}`)
        return undefined
    } else {
        let path = []
        for (let i = end; i !== -1; i = p[i])
            path.push(i)

        path = path.reverse()
        return path
    }
}

function dijkstra(start, nodes1 = nodes) {
    let d = Array(nodes1.size).fill(Number.MAX_VALUE), p = Array(nodes1.size), v = []
    d[start] = 0

    for (let i = 0; i < nodes1.size; i++) {
        let a = -1
        for (let j = 0; j < nodes1.size; j++) {
            if (!v.includes(j) && (a === -1 || d[j] < d[a]))
                a = j
        }

        if (d[a] === Number.MAX_VALUE)
            break

        v.push(a)
        for (let [to, len] of nodes1.get(a)) {
            to = parseInt(to)
            len = parseInt(len[0])

            if (len !== 0 && d[a] + len < d[to]) {
                d[to] = d[a] + len
                p[to] = a
            }
        }
    }

    for (let i = 0; i < d.length; i++)
        if (d[i] === Number.MAX_VALUE)
            d[i] = -1

    return d
    /*let path = []

    for (let i = 1; i !== start; i = p[i]) {
        path.push(i)
    }

    path.push(start)
    path.reverse()

    return path*/
}

function task4() {
    clear()
    let start = parseInt(prompt("Введите начальную вершину", '0'))
    let d = dijkstra(start)
    alerting("Вектор расстояний до вершин: " + d + "\n")
    let matrix = ''

    for (let i = 0; i < nodes.size; i++)
        if (i !== nodes.size - 1)
            matrix += dijkstra(i) + '\n'
        else
            matrix += dijkstra(i)

    alerting("Матрица расстояний от каждой вершины до каждой:\n" + matrix, true)
    save(matrix, "Сохранить матрицу")
}

function task6(needCenter = false) {
    clear()
    let n = nodes.size, inf = Number.MAX_VALUE
    let d = getAdjMatrix(), e = Array(n).fill(0)
    let c = new Set(), rad = Number.MAX_VALUE, diam = 0

    for (let k = 0; k < n; k++) {
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                if (d[i][j] === 0)
                    d[i][j] = inf

                if (d[i][k] === 0)
                    d[i][k] = inf

                if (d[k][j] === 0)
                    d[k][j] = inf

                d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j])
            }
        }
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            e[i] = Math.max(e[i], d[i][j])
        }
    }

    for (let i = 0; i < n; i++) {
        rad = Math.min(rad, e[i])
        diam = Math.max(diam, e[i])
    }

    for (let i = 0; i < n; i++) {
        if (e[i] === rad) {
            c.add(i)
        }
    }

    if (needCenter)
        return {c, diam}

    let degrees = Array(n).fill(0)
    for (let [node1, nodes1] of nodes)
        for (let node2 of nodes1.values())
            if (node1 !== node2)
                degrees[node1]++
            else
                degrees[node2] += 2

    let text
    if (rad === Number.MAX_VALUE)
        text = "У графа нет радиуса и диаметра.\nВектор степеней: " + degrees
    else
        text = "Радиус графа: " + rad + "\nДиаметр графа: " + diam + "\nВектор степеней: " + degrees

    alerting(text)
    save(text, "Сохранить данные")
}

function task8() {
    clear()
    let adjMtx = getAdjMatrix(), isOriented = false, connectivity = undefined
    for (let curve of curves.values())
        if (curve.startArrow !== undefined && curve.startArrow.visible()
            || curve.endArrow !== undefined && curve.endArrow.visible()) {
            isOriented = true
            break
        }

    let matrix = [], strong = true
    for (let i = 0; i < nodes.size; i++)
        matrix.push(dijkstra(i))

    if (!isOriented) {
        for (let line of matrix)
            if (line.includes(-1)) {
                connectivity = "Граф является несвязным"
                break
            }

        if (connectivity === undefined)
            connectivity = "Граф является связным"
    } else {
        for (let line of matrix)
            if (line.includes(-1)) {
                connectivity = "Граф является несвязным"

                let newNodes = new Map()
                for (let node of nodes.keys())
                    newNodes.set(node, new Map())

                for (let [node1, nodes1] of nodes) {
                    for (let node2 of nodes1.keys())
                        newNodes.get(node1).set(node2, [1])
                }

                let matrix2 = []
                for (let i = 0; i < newNodes.size; i++)
                    matrix2.push(dijkstra(i, newNodes))

                for (let line2 of matrix2) {
                    if (line2.includes(-1))
                        strong = false
                }

                break
            }

        if (connectivity === undefined && !strong)
            connectivity = "Граф является сильно-связным"
        else
            connectivity = "Граф является слабо-связным"
    }

    alerting(connectivity + ".\n" +
        connectivityComp() + ".\n" +
        "Количество мостов в графе: " + bridgesCount() + ".\n" +
        "Количество точек сочленения в графе: " + articulationPoint())
}

function connectivityComp() {
    let g = getAdjLists(), used = Array(nodes.size).fill(false), comp = [], count = 0

    function dfs(start) {
        used[start] = true
        comp[count].push(start)
        for (let i = 0; i < g[start].length; ++i) {
            let to = g[start][i]
            if (!used[to])
                dfs(to)
        }
    }

    for (let i = 0; i < nodes.size; ++i)
        if (!used[i]) {
            comp.push([])
            dfs(i)
            count++
        }

    let text = "Количество компонент в графе: " + count + ". Их состав:"
    comp.forEach(c => text += "\n" + (comp.indexOf(c) + 1) + ": " + c)

    return text
}

function bridgesCount() {
    let g = getAdjLists(), used = Array(nodes.size).fill(false)
    let timer = 0, tin = Array(nodes.size), fup = Array(nodes.size), count = 0

    function dfs(v, p = -1) {
        used[v] = true
        tin[v] = fup[v] = timer++

        for (let i = 0; i < g[v].length; ++i) {
            let to = g[v][i]
            if (to === p)
                continue

            if (used[to])
                fup[v] = Math.min(fup[v], tin[to])
            else {
                dfs(to, v)
                fup[v] = Math.min(fup[v], fup[to])
                if (fup[to] > tin[v])
                    count++
            }
        }
    }

    for (let i = 0; i < g.length; ++i)
        if (!used[i])
            dfs(i)

    return count
}

function articulationPoint() {
    let g = getAdjLists(), used = Array(nodes.size).fill(false)
    let timer = 0, tin = Array(nodes.size), fup = Array(nodes.size), count = 0

    function dfs(v, p = -1) {
        used[v] = true
        tin[v] = fup[v] = timer++
        let children = 0
        for (let i = 0; i < g[v].length; ++i) {
            let to = g[v][i]
            if (to === p)
                continue

            if (used[to])
                fup[v] = Math.min(fup[v], tin[to])
            else {
                dfs(to, v)
                fup[v] = Math.min(fup[v], fup[to])
                if (fup[to] >= tin[v] && p !== -1)
                    count++
                ++children;
            }
        }

        if (p === -1 && children > 1)
            count++
    }

    dfs(0)
    return count
}

function task9() {
    clear()
    let isFull = true, lists = getAdjLists()
    for (let list of lists)
        if (list.length !== lists.length) {
            isFull = false
            break
        }

    addHistoryCommand({
        undo: () => {
            let listsNew = getAdjLists()
            for (let i = 0; i < listsNew.length; i++)
                for (let j = 0; j < listsNew.length; j++)
                    if (i !== j && listsNew[i].includes(j) && !lists[i].includes(j) && Array.from(nodes.get(i).keys()).includes(j))
                        deleteEdge(i, j)
        },
        redo: () => {
            if (isFull) {
                alerting("Граф полный")
            } else {
                for (let i = 0; i < lists.length; i++)
                    for (let j = 0; j < lists.length; j++)
                        if (i !== j && !lists[i].includes(j) && !Array.from(nodes.get(j).keys()).includes(i)) {
                            addEdge(i, j, 1)
                            getCurve(i, j).stroke('green')
                        }
            }
        }
    }).redo()
}

function task13() {
    clear()
    let g = [], x, y, res = [], cost = 0
    for (let i = 1; i < trs.length; i++) {
        for (let j = i; j < trs[i].cells.length; j++) {
            x = trs[i].cells[j].textContent
            y = trs[j].cells[i].textContent

            if (x !== '0' || y !== '0') {
                g.push({
                    weight: parseInt(x),
                    first: i - 1,
                    second: j - 1
                })
            }
        }
    }

    g.sort((a, b) => a.weight < b.weight ? -1 : (a.weight > b.weight ? 1 : 0))
    let tree_id = Array(nodes.size)
    for (let i = 0; i < tree_id.length; i++)
        tree_id[i] = i

    for (let i = 0; i < g.length; i++) {
        let a = g[i].first, b = g[i].second, l = g[i].weight
        if (tree_id[a] !== tree_id[b]) {
            cost += l
            res.push({
                first: a,
                second: b,
                weight: l
            })
            let old_id = tree_id[b], new_id = tree_id[a]
            for (let j = 0; j < nodes.size; ++j)
                if (tree_id[j] === old_id)
                    tree_id[j] = new_id
        }
    }

    addHistoryCommand({
        undo: () => {
            for (let i = 0; i < g.length; i++) {
                if (nodes.get(g[i].first).get(g[i].second) === undefined ||
                    nodes.get(g[i].second).get(g[i].first) === undefined)
                    addEdge(g[i].first, g[i].second, g[i].weight)
            }
        },
        redo: () => {
            let lists = getAdjLists()
            for (let i = 0; i < lists.length; i++)
                for (let j = 0; j < lists.length; j++)
                    if (i !== j && lists[i].includes(j) && Array.from(nodes.get(i).keys()).includes(j))
                        deleteEdge(i, j)

            for (let edge of res)
                addEdge(edge.first, edge.second, edge.weight)
        }
    }).redo()
}

function task14() {
    clear()
    let color = Array(nodes.size).fill(0), catalogCycles = [], E = [], G = getAdjLists(), find = false

    for (let i = 0; i < G.length; i++)
        for (let j = 0; j < G[i].length; j++) {
            E.push({
                v1: i,
                v2: G[i][j]
            })

            if (G[G[i][j]].includes(i))
                G[G[i][j]].splice(G[G[i][j]].indexOf(i), 1)
        }

    function DFSCycle(fromNode, toNode, colors, unavailableEdge, cycle) {
        if (fromNode !== toNode)
            colors[fromNode] = 2
        else if (cycle.length >= 2) {
            let currentCycle = []
            for (let i = 0; i < cycle.length; i++)
                currentCycle.push(cycle[i])

            catalogCycles.push(currentCycle)
            if (currentCycle.length === 4)
                find = true

            return
        }

        for (let w of E) {
            if (w === unavailableEdge)
                continue

            if (colors[w.v2] === 1 && w.v1 === fromNode) {
                let cycleNEW = cycle.slice()
                cycleNEW.push(w.v2)
                DFSCycle(w.v2, toNode, colors, w, cycleNEW)
                if (find)
                    return
                colors[w.v2] = 1
            } else if (colors[w.v1] === 1 && w.v2 === fromNode /*&& !w.IsOriented*/) {
                let cycleNEW = cycle.slice()
                cycleNEW.push(w.v1)
                DFSCycle(w.v1, toNode, colors, w, cycleNEW)
                if (find)
                    return
                colors[w.v1] = 1
            }
        }
    }

    for (let i = 0; i < nodes.size; i++) {
        color = Array(nodes.size).fill(1)
        let cycle = []
        cycle.push(i)
        DFSCycle(i, i, color, -1, cycle)
    }

    let min = nodes.size + 1, idx = -1, idxMax
    catalogCycles.find((el, id, arr) => {
        if (el.length < min && el.length !== 2) {
            min = el.length
            idx = id
        } else if (el.length !== 2)
            idxMax = id
    })

    if (catalogCycles.length === 0) {
        let answer = task6(true)
        alerting("Граф ацикличен.\nЦентр дерева: " + Array.from(answer.c) + "\n"
            + "Глубина дерева: " + (answer.diam === Number.MAX_VALUE ? 0 : answer.diam))
    } else if (idx !== -1) {
        paintCommand(catalogCycles[idx], false, "Минимальный цикл: ")
    } else {
        paintCommand(catalogCycles[idxMax], false, "Минимальный цикл: ")
    }
}

function task15(getColorCount = false) {
    clear()
    let adjLists = getAdjLists(), lists = Array(adjLists.length)
    for (let i = 0; i < adjLists.length; i++)
        adjLists[i] = {idx: i, list: adjLists[i]}

    adjLists.sort((a, b) => a.list.length > b.list.length ? -1 : (a.list.length === b.list.length ? 0 : 1))
    for (let i = 0; i < adjLists.length; i++) {
        lists[i] = adjLists[i].list
        adjLists[i] = adjLists[i].idx
    }

    let chromaticMin = nodes.size, painteds, used

    for (let n = 0; n < nodes.size; n++) {
        let painted = Array(nodes.size).fill(-1), colors = []
        painted[n] = 0
        colors.push(0)
        for (let i = 0; i < painted.length; i++) {
            if (painted[i] === -1) {
                used = Array(colors.length).fill(false)
                for (let j = 0; j < lists[i].length; j++) {
                    if (painted[adjLists.indexOf(lists[i][j])] !== -1)
                        used[painted[adjLists.indexOf(lists[i][j])]] = true
                }

                if (used.indexOf(false) === -1) {
                    painted[i] = colors.length
                    colors.push(colors.length)
                } else {
                    painted[i] = used.indexOf(false)
                }


                for (let j = i + 1; j < painted.length; j++) {
                    if (!lists[i].includes(adjLists[j]) && painted[j] === -1) {
                        painted[j] = painted[i]
                        for (let k = 0; k < lists[j].length; k++) {
                            if (painted[adjLists.indexOf(lists[j][k])] === painted[j]) {
                                if (painted[j] !== colors[0])
                                    painted[j] = colors[0]
                                else
                                    painted[j] = -1

                                break
                            }
                        }
                    }
                }
            }
        }

        if (colors.length < chromaticMin) {
            chromaticMin = colors.length
            painteds = [ ...painted]
        }
    }

    if (getColorCount)
        return chromaticMin

    addHistoryCommand({
        undo: () => {
            for (let node of nodesDrawn.values())
                node.children[0].fill('#ddd')
        },
        redo: () => {
            alerting("Хроматическое число графа: " + chromaticMin)
            for (let i = 0; i < adjLists.length; i++) {
                let int = painteds[i] + 1
                nodesDrawn.get(adjLists[i]).children[0].fill(
                    'rgb(' + int * 123 % 255 + ',' + int * 547 % 255 + ',' + int * 432 % 255 + ')'
                )
            }
        }
    }).redo()
}

function task16() {
    clear()
    let N = nodes.size, G = getAdjLists(), part = Array(N).fill(-1), ok = true, q = Array(N).fill(0)
    for (let st = 0; st < N; ++st)
        if (part[st] === -1) {
            let h = 0, t = 0
            q[t++] = st
            part[st] = 0
            while (h < t) {
                let v = q[h++]
                for (let i = 0; i < G[v].length; ++i) {
                    let to = G[v][i]
                    if (part[to] === -1) {
                        part[to] = !part[v]
                        q[t++] = to
                    }
                    else
                        ok &= part[to] !== part[v]
                }
            }
        }

    if (!ok) {
        alert("Граф не является двудольным")
        return
    }

    let lists = getAdjLists(), n = lists.length, used, matching = Array(n).fill(-1)

    function dfs(v) {
        if (used[v])
            return false

        used[v] = true
        for (let to of lists[v])
            if (matching[to] === -1 || dfs(matching[to])) {
                matching[to] = v
                return true
            }

        return false
    }

    for (let i = 0; i < n; i++) {
        used = Array(n).fill(false)
        dfs(i)
    }

    addHistoryCommand({
        undo: () => {
            for (let name of curves.keys()) {
                layer.findOne("#" + name).stroke('blue')
                layer.findOne("#" + name).opacity(1)
            }
        },
        redo: () => {
            let matchingCopy = matching.slice()
            let listsCopy = getAdjLists()
            for (let i = 0; i < matchingCopy.length; i++) {
                if (matchingCopy[i] !== -1 && matchingCopy[i] !== undefined) {
                    let from = i, to = matchingCopy[i]
                    listsCopy[from].splice(listsCopy[from].indexOf(to), 1)
                    listsCopy[to].splice(listsCopy[to].indexOf(from), 1)
                    let curve = getCurve(from, to)
                    curve.stroke('rgb(' + i * 123 % 255 + ',' + i * 547 % 255 + ',' + i * 432 % 255 + ')')
                    matchingCopy[matchingCopy[i]] = undefined
                }
            }

            for (let i = 0; i < listsCopy.length; i++) {
                if (listsCopy[i].length !== 0) {
                    for (let j = 0; j < listsCopy[i].length; j++) {
                        let curve = getCurve(i, listsCopy[i][j])
                        curve.opacity(0.2)
                    }
                }
            }
        }
    }).redo()
}

function bestFirstSearch(from, to) {
    clear()
    let graph = getMapEdges(nodes)
    let queue = new PriorityQueue()
    let path = new Map()
    let visited = new Set()
    path.set(from, undefined);
    let sum = 0
    queue.push(from, 0)
    visited.add(from)
    while (!queue.isEmpty()) {
        let x = queue.pop()
        for (const pair of graph.get(x)) {
            if (!visited.has(pair.to)) {
                visited.add(pair.to)
                queue.push(pair.to, pair.cost)
                path.set(pair.to, x)
            }
        }
    }

    let pathArr = [to]
    while (path.get(to) !== undefined) {
        sum += nodes.get(to).get(path.get(to))[0]
        pathArr.push(path.get(to))
        to = path.get(to)
    }

    pathArr = pathArr.reverse()
    alerting("Стоимость пути: " + sum)

    return pathArr
}

function trick(from, to) {
    from = nodesDrawn.get(from)
    to = nodesDrawn.get(to)
    return Math.sqrt(Math.pow(from.x() - to.x(), 2) + Math.pow(from.y() - to.y(), 2))
}

function aStar(from, to) {
    clear()
    let graph = getMapEdges(nodes)
    let queue = new PriorityQueue()
    let cameFrom = new Map()
    let cost = new Map()
    queue.push(from, 0)
    cameFrom.set(from, undefined)
    cost.set(from, 0)
    let cur
    while (!queue.isEmpty()) {
        cur = queue.pop()
        if (cur === to)
            break

        for (const pair of graph.get(cur)) {
            let newCost = cost.get(cur) + pair.cost;
            if (!cost.has(pair.to) || newCost < cost.get(pair.to)) {
                cost.set(pair.to, newCost)
                queue.push(pair.to, trick(to, pair.to) + newCost)
                cameFrom.set(pair.to, cur)
            }
        }
    }

    //cost = cost.get(to)
    let sum = 0
    let pathArr = [to]
    while (cameFrom.get(to) !== undefined) {
        sum += nodes.get(to).get(cameFrom.get(to))[0]
        pathArr.push(cameFrom.get(to))
        to = cameFrom.get(to)
    }

    alerting("Стоимость пути:" + sum)
    return pathArr.reverse()
}

function stupidMethod(matrix1, matrix2) {
    if (matrix1.length !== matrix2.length) return false;
    let shift = new Array(matrix1.length);
    let indexes = new Array(matrix1.length).fill(0);
    for (let i = 0; i < shift.length; i++) {
        shift[i] = i;
    }
    let i = 0;
    while (i < shift.length) {
        if (indexes[i] < i) {
            if (i % 2 === 0) [shift[0], shift[i]] = [shift[i], shift[0]];
            else [shift[indexes[i]], shift[i]] = [shift[i], shift[indexes[i]]];
            indexes[i]++;
            i = 0;
        } else {
            indexes[i] = 0;
            i++;
        }
        if (compareAdjMatrix(matrix1, matrix2, shift)) return true;
    }
    return false;
}

function compareAdjMatrix(matrix1, matrix2, ind) {
    if (matrix1.length !== matrix2.length) return false;
    for (let i = 0; i < ind.length; i++) {
        for (let j = 0; j < ind.length; j++) {
            if (matrix1[i][j] !== matrix2[ind[i]][ind[j]]) return false;
        }
    }
    return true;
}

function getAdjMatrix2(graph) {
    let matrix = new Array(graph.size);
    for (let i = 0; i < matrix.length; i++) {
        matrix[i] = new Array(matrix.length).fill(0);
    }

    let keys = [...graph.keys()];
    for (const v of graph.keys()) {
        for (const pair of graph.get(v)) {
            matrix[keys.indexOf(v)][keys.indexOf(pair.to)]++;
        }
    }
    return matrix;
}

function task7() {
    if (nodes2 === undefined) {
        nodes2 = new Map()
        for (let [node1, nodes1] of nodes) {
            nodes2.set(node1, new Map())
            for (let [node2, weights] of nodes1) {
                nodes2.get(node1).set(node2, ...weights)
            }
        }

        clear()
        alert(`Для проверки на изоморфизм этого графа, откройте второй граф любым предложенным способом!\nПосле снова нажмите эту кнопку.`)
    } else {
        if (stupidMethod(getAdjMatrix2(getMapEdges(nodes2)), getAdjMatrix2(getMapEdges(nodes))))
            alerting("Графы изоморфны")
        else
            alerting("Графы не изоморфны")
        nodes2 = undefined
    }
}

function task10() {
    clear()
    let gr = getAdjMatrix2(getMapEdges(nodes)), dim = gr.length
    let checker = new PlanarityCheker(gr, dim)
    let faces = checker.getPlanarLaying()
    if (faces !== undefined) {

        let area = (a, b, c) => {
            return (b.x() - a.x()) * (c.y() - a.y()) - (b.y() - a.y()) * (c.x() - a.x())
        }

        let intersect_1 = (a, b, c, d) => {
            if (a > b)
                [a, b] = [b, a]
            if (c > d)
                [c, d] = [d, c]

            return Math.max(a, c) <= Math.min(b,d)
        }

        let intersect = (a, b, c, d) => {
            return intersect_1(a.x(), b.x(), c.x(), d.x())
                && intersect_1(a.y(), b.y(), c.y(), d.y())
                && area(a, b, c) * area(a, b, d) <= 0
                && area(c, d, a) * area(c, d, b) <= 0
        }

        let graph = getAdjLists(), lists = []
        for (let i = 0; i < graph.length; i++)
            for (let j = 0; j < graph[i].length; j++) {
                lists.push({
                    v1: i,
                    v2: graph[i][j]
                })

                if (graph[graph[i][j]].includes(i))
                    graph[graph[i][j]].splice(graph[graph[i][j]].indexOf(i), 1)
            }

        let isIntersect = false

        for (let i = 0; i < lists.length; i++) {
            for (let j = i+1; j < lists.length; j++) {
                if (lists[i].v1 === lists[j].v1 || lists[i].v1 === lists[j].v2 ||
                    lists[i].v2 === lists[j].v1 || lists[i].v2 === lists[j].v2) {
                    continue
                }


                if (intersect(nodesDrawn.get(lists[i].v1), nodesDrawn.get(lists[i].v2),
                    nodesDrawn.get(lists[j].v1), nodesDrawn.get(lists[j].v2))) {
                    isIntersect = true
                    break
                }
            }
        }

        if (isIntersect)
            alerting("Граф планарный\nГраф не плоский")
        else
            alerting("Граф планарный\nГраф плоский")
    } else {
        alerting("Граф не планарный")
    }
}

function task11() {
    clear()
    let vector = prompt("Введите вектор:")
    vector = vector.split(" ")
    vector.forEach(el => el = parseInt(el))
    let solver = new ReductionAlgoSolver(vector)
    if (solver === undefined) {
        alert("Вектор не приводим")
        return
    }

    let str = "Промежуточные векторы:\n"
    for (const solverElement of solver.answer) {
        str += solverElement + '\n'
    }

    alerting(str)
    if (solver.graph.isExtreme) {
        alerting("Граф экстримальный", true)
        str = "База:\n"
        for (const el of solver.graph.base) {
            str += el.first + " -> " + el.second + '\n'
        }

        alerting(str, true)
    } else {
        alerting("Граф не экстримальный", true)
        let matrix = solver.graph.matrix
        reDraw(matrix)
    }
}

function base(arr) {
    let str = ''
    for (const el of arr) {
        str += el.first + " -> " + el.second + '\n'
    }

    return str
}

function reDraw(matrix) {
    nodes.clear()
    layer.destroyChildren()
    layer.add(new Konva.Rect({
        width: width,
        height: height,
        fill: 'lightgrey',
        opacity: 0.3
    }))

    while (trs.length > 1)
        trs[1].remove()

    while (trs[0].childNodes.length !== 2)
        trs[0].childNodes[2].remove()

    for (let i = 0; i < matrix.length; i++) {
        addNode(xCenter + 150 * Math.cos(90 + 2 * Math.PI * i / matrix.length),
            yCenter + 150 * Math.sin(90 + 2 * Math.PI * i / matrix.length), i, nodes[i])
    }

    for (let i = 0; i < matrix.length; i++) {
        for (let j = i; j < matrix[i].length; j++) {
            addToMatrix(i, j, matrix[i][j], matrix[j][i])
        }
    }
}

function getLists(arr) {
    let str = ""
    for (const el of arr) {
        str += el.from + '-' + el.to + "\n"
    }

    return str
}

async function task12(n, solver) {
    let text
    switch (n) {
        case 0:
            clear()
            let vector = prompt("Введите первую базу:")
            let base1 = []
            vector = vector.split(",")
            for (const str of vector) {
                let arr = str.trim().split("-")
                base1.push({first:parseInt(arr[0]), second:parseInt(arr[1])})
            }

            vector = prompt("Введите вторую базу:")
            let base2 = []
            vector = vector.split(",")
            for (const str of vector) {
                let arr = str.trim().split("-")
                base2.push({first:parseInt(arr[0]), second:parseInt(arr[1])})
            }

            let solver1 = new ExtrimGraphsSolver(base1, base2)

            if (solver1.firstGraph === undefined) {
                alert("Первая база задана неверно")
                return
            }

            if (solver1.secGraph === undefined) {
                alert("Вторая база задана неверно")
                return
            }

            reDraw(solver1.firstGraph.matrix)
            alerting("Вектор степеней вершин первого графа:\n" + solver1.firstGraph.vertsPowVector + "\n")
            showNextButton(1, solver1)
            break

        case 1:
            reDraw(solver.secGraph.matrix)
            alerting("Вектор степеней вершин второго графа:\n" + solver.secGraph.vertsPowVector + "\n", true)
            showNextButton(2, solver)
            break

        case 2:
            text = "Список ребер вершин дополнения первого графа:\n" + getLists(solver.firstAdditional.edgesList)
            text += "Вектор степеней вершин дополнения первого графа:\n" + solver.firstAdditional.vertsPowVector + "\n"
            if (solver.firstAdditional.isExtreme)
                text += "База дополнения первого графа:\n" + base(solver.firstAdditional.base)
            else {
                text += "Дополнение первого графа не экстремально\n"
            }

            alerting(text + "\n", true)
            reDraw(solver.firstAdditional.matrix)
            showNextButton(3, solver)
            break

        case 3:
            text = "Список ребер вершин дополнения второго графа:\n" + getLists(solver.secAdditional.edgesList)
            text += "Вектор степеней вершин дополнения второго графа:\n" + solver.secAdditional.vertsPowVector + "\n"
            if (solver.secAdditional.isExtreme)
                text += "База дополнения второго графа:\n" + base(solver.secAdditional.base)
            else {
                text += "Дополнение второго графа не экстремально\n"
            }

            alerting(text + "\n", true)
            reDraw(solver.secAdditional.matrix)
            showNextButton(4, solver)
            break

        case 4:
            text = "Список ребер вершин объединения графов:\n" + getLists(solver.union.edgesList)
            text += "Вектор степеней вершин объединения графов:\n" + solver.union.vertsPowVector + "\n"
            if (solver.union.isExtreme)
                text += "База объединения графов:\n" + base(solver.union.base)
            else {
                text += "Объединение графов не экстремально\n"
            }

            alerting(text + "\n", true)
            reDraw(solver.union.matrix)
            showNextButton(5, solver)
            break

        case 5:
            text = "Список ребер вершин пересечения графов:\n" + getLists(solver.intersection.edgesList)
            text += "Вектор степеней вершин пересечения графов:\n" + solver.intersection.vertsPowVector + "\n"
            if (solver.intersection.isExtreme)
                text += "База пересечения графов:\n" + base(solver.intersection.base)
            else {
                text += "Пересечение графов не экстремально\n"
            }

            alerting(text + "\n", true)
            reDraw(solver.intersection.matrix)
            showNextButton(6, solver)
            break

        case 6:
            if (solver.firstReduce !== undefined) {
                text = "Список ребер вершин вычитания из первого графа второго графа:\n" + getLists(solver.firstReduce.edgesList)
                text += "Вектор степеней вычитания из первого графа второго графа:\n" + solver.firstReduce.vertsPowVector + "\n"
                if (solver.firstReduce.isExtreme)
                    text += "База вычитания из первого графа второго графа:\n" + base(solver.firstReduce.base)
                else {
                    text += "Вычитание из первого графа второго графа не экстремально\n"
                }

                alerting(text + "\n", true)
                reDraw(solver.firstReduce.matrix)
            } else {
                alerting("Вычитание невозможно, так как второй граф больше первого графа\n", true)
            }

            showNextButton(7, solver)
            break

        case 7:
            if (solver.secReduce !== undefined) {
                text = "Список ребер вершин вычитания из второго графа первого графа:\n" + getLists(solver.secReduce.edgesList)
                text += "Вектор степеней вычитания из второго графа первого графа:\n" + solver.secReduce.vertsPowVector + "\n"
                if (solver.secReduce.isExtreme)
                    text += "База вычитания из второго графа первого графа:\n" + base(solver.secReduce.base)
                else {
                    text += "Вычитание из второго графа первого графа не экстремально\n"
                }

                alerting(text + "\n", true)
                reDraw(solver.secReduce.matrix)
            } else {
                alerting("Вычитание невозможно, так как первый граф больше второго\n", true)
            }

            showNextButton(-1, solver)
            save(document.getElementById('alert').textContent)
            break

    }
}