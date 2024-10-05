#!/usr/bin/env node
const { program } = require("commander");
const seedRandom = require("seedrandom");

program.option("-w, --width <number>", "set the width > 1")
    .option("-h, --height <number>", "set the height > 1")
    .option("-s, --seed <number>", "set the seed")
    .option("-a, --animate", "run the animation")
    .option("-d, --delay <number>", "set the animation step delay")
    .option("-j, --json", "print json data")
    .parse(process.argv);

options = program.opts();
const width = Number(options.width) || 20;
const height = Number(options.height) || 20;
const seed = Number(options.seed) || Math.random(); //0.1295835173612654
const animate = options.animate || false;
const delay = options.delay || 10;
const json = options.json || false;

const absWidth = width%2 ? width : width+1;
const absHeight = height%2 ? height : height+1;
const navWidth = Math.ceil((width-1)/2)
const navHeight = Math.ceil((height-1)/2)
var mazeAbs = Array(absHeight).fill(null).map(() => Array(absWidth).fill(1));
var mazeNav = Array(navHeight).fill(null).map(() => Array(navWidth).fill(0));
var current_pos, previous_pos;

const N = 1, E = 2, S = 4, W = 8;
const generator = seedRandom(seed);

Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(generator() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
}

function moveX(direction) {
    return (direction == E ? 1 : direction == W ? -1 : 0);
}

function moveY(direction) {
    return (direction == S ? 1 : direction == N ? -1 : 0);
}

function opposite(direction) {
    return direction == N ? S :
        direction == E ? W :
            direction == S ? N :
                direction == W ? E :
                    undefined;
}

function printMaze() {
    let result = " " + "_".repeat(mazeNav[0].length * 2 - 1) + "\n";
    for (let y = 0; y < mazeNav.length; y++) {
        result += "|";
        for (let x = 0; x < mazeNav[y].length; x++) {
            if (animate && current_pos.x == x && current_pos.y == y) result += "\x1b[47m";
            result += (mazeNav[y][x] & S) != 0 ? " " : "_";
            result += "\x1b[0m"
            if ((mazeNav[y][x] & E) != 0) result += ((mazeNav[y][x] | mazeNav[y][x + 1]) & S) != 0 ? " " : "_";
            else result += "|";
        }
        result += "\n";
    }
    console.clear()
    console.log(result);
}

function printMazeData(data) {
    data.forEach(y => {
        y.forEach(x => process.stdout.write(x + " "));
        process.stdout.write("\n");
    });
}

async function stepSimulation() {
    if (JSON.stringify(current_pos) != JSON.stringify(previous_pos)) {
        printMaze();
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

async function maze_build_from(x, y) {
    let directions = [N, E, S, W].shuffle();
    mazeAbs[y*2+1][x*2+1] = 0

    for (const direction of directions) {
        let ny = y + moveY(direction);
        let nx = x + moveX(direction);

        current_pos = { x: x, y: y };

        if (animate) await stepSimulation();

        previous_pos = current_pos;

        if (ny >= 0 && ny < navHeight && nx >= 0 && nx < navWidth && mazeNav[ny][nx] == 0) {
            mazeNav[y][x] |= direction;
            mazeNav[ny][nx] = opposite(direction);
            mazeAbs[ny*2+1 - moveY(direction)][nx*2+1 - moveX(direction)] = 0;
            current_pos = { x: nx, y: nx }
            await maze_build_from(nx, ny);
        }
    }

    current_pos = { x: x, y: y };
    if (animate) await stepSimulation();
}


maze_build_from(Math.floor(generator() * (navWidth)), Math.floor(generator() * (navHeight))).then(() => {
    if (json) {
        console.log(JSON.stringify({
            width: width,
            height: height,
            seed: seed,
            matrix: mazeAbs
        }))
    } else {
        printMaze()
        console.log("Size:", absWidth, "x", absWidth)
        console.log("Seed:", seed);
    }
});
