from qiskit import QuantumCircuit, quantum_info
from PIL.Image import new as newimage, Image
from typing import Callable, Literal, TypeAlias
import math

Height: TypeAlias = dict[tuple[int, int], float]
Probs: TypeAlias = dict[str, float]


def get_size(height: Height):
    """
    Determines the size of the grid for the given height map.
    """
    Lx = 0
    Ly = 0
    for x, y in height:
        Lx = max(x + 1, Lx)
        Ly = max(y + 1, Ly)
    return Lx, Ly


def normalize(ket: list[float]):
    """
    Normalizes the given statevector.

    Args:
        ket (list or array_like)

    Returns:
        ket (list or array_like)
    """
    N: float = 0
    for amp in ket:
        N += amp * amp.conjugate()
    for j, amp in enumerate(ket):
        ket[j] = float(amp) / math.sqrt(N)
    return ket


def make_line(length: int):
    """
    Creates a list of bit strings of at least the given length, such
    that the bit strings are all unique and consecutive strings
    differ on only one bit.

    Args:
        length (int): Required length of output list.

    Returns:
        line (list): List of 2^n n-bit strings for n=⌊log_2(length)⌋
    """

    # number of bits required
    n = int(math.ceil(math.log(length) / math.log(2)))

    # iteratively build list
    line = ["0", "1"]
    for j in range(n - 1):
        # first append a reverse-ordered version of the current list
        line = line + line[::-1]
        # then add a '0' onto the end of all bit strings in the first half
        for j in range(int(float(len(line)) / 2)):
            line[j] += "0"
        # and a '1' for the second half
        for j in range(int(float(len(line)) / 2), int(len(line))):
            line[j] += "1"

    return line


def make_grid(Lx: int, Ly: int | None = None):
    """
    Creates a dictionary that provides bit strings corresponding to
    points within an Lx by Ly grid.

    Args:
        Lx (int): Width of the lattice (also the height if no Ly is
            supplied).
        Ly (int): Height of the lattice if not Lx.

    Returns:
        grid (dict): Dictionary whose values are points on an
            Lx by Ly grid. The corresponding keys are unique bit
            strings such that neighbouring strings differ on only
            one bit.
        n (int): Length of the bit strings

    """
    # set Ly if not supplied
    if not Ly:
        Ly = Lx

    # make the lines
    line_x = make_line(Lx)
    line_y = make_line(Ly)

    # make the grid
    grid: dict[str, tuple[int, int]] = {}
    for x in range(Lx):
        for y in range(Ly):
            grid[line_x[x] + line_y[y]] = (x, y)

    # determine length of the bit strings
    n = len(line_x[0] + line_y[0])

    return grid, n


def height2circuit(height: Height, log: bool = False, eps: float = 1e-2):
    """
    Converts a dictionary of heights (or brightnesses) on a grid into
    a quantum circuit.

    Args:
        height (dict): A dictionary in which keys are coordinates
            for points on a grid, and the values are positive numbers of
            any type.
        log (bool): If given, a logarithmic encoding is used.

    Returns:
        qc (QuantumCircuit): A quantum circuit which encodes the
            given height dictionary.
    """
    # get bit strings for the grid
    Lx, Ly = get_size(height)
    grid, n = make_grid(Lx, Ly)

    # create required state vector
    state: list[float] = [0] * (2**n)
    if log:
        # normalize heights
        max_h: float = max(height.values())
        height = {pos: float(height[pos]) / max_h for pos in height}
        # find minimum (not too small) normalized height
        min_h = min([height[pos] for pos in height if height[pos] > eps])
        # this minimum value defines the base
        base = 1.0 / min_h

    for bitstring in grid:
        (x, y) = grid[bitstring]
        if (x, y) in height:
            h = height[x, y]
            if log:
                state[int(bitstring, 2)] = math.sqrt(base ** (float(h) / min_h))
            else:
                state[int(bitstring, 2)] = math.sqrt(h)
    state = normalize(state)

    # define and initialize quantum circuit
    qc = QuantumCircuit(n)
    qc.initialize(state, range(n))
    qc.name = "(" + str(Lx) + "," + str(Ly) + ")"

    return qc


def kron(vec0, vec1):
    """
    Calculates the tensor product of two vectors.
    """
    new_vec = []
    for amp0 in vec0:
        for amp1 in vec1:
            new_vec.append(amp0 * amp1)
    return new_vec


def circuit2probs(qc: QuantumCircuit) -> Probs:
    """
    Runs the given circuit, and returns the resulting probabilities.
    """

    # separate circuit and initialization
    new_qc = qc.copy()
    new_qc.data = []
    initial_ket = [1]
    for gate in qc.data:
        if gate[0].name == "initialize":
            initial_ket = kron(initial_ket, gate[0].params)
        else:
            new_qc.data.append(gate)
    # if there was no initialization, use the standard state
    if len(initial_ket) == 1:
        initial_ket = [0] * 2**qc.num_qubits
        initial_ket[0] = 1
    # then run it
    ket = quantum_info.Statevector(initial_ket)
    ket = ket.evolve(new_qc)
    probs = ket.probabilities_dict()

    return probs


def probs2height(
    probs: Probs, size: tuple[int, int] | None = None, log: bool = False
) -> Height:
    """
    Extracts a dictionary of heights (or brightnesses) on a grid from
    a set of probabilities for the output of a quantum circuit into
    which the height map has been encoded.

    Args:
        probs (dict): A dictionary with results from running the circuit.
            With bit strings as keys and either probabilities or counts as
            values.
        size (tuple): Size of the height map to be created. If not given,
            the size is deduced from the number of qubits (assuming a
            square image).
        log (bool): If given, a logarithmic decoding is used.

    Returns:
        height (dict): A dictionary in which keys are coordinates
            for points on a grid, and the values are floats in the
            range 0 to 1.
    """

    # get grid info
    if size:
        (Lx, Ly) = size
    else:
        Lx = int(2 ** (len(list(probs.keys())[0]) / 2))
        Ly = Lx
    grid, _ = make_grid(Lx, Ly)

    # set height to probs value, rescaled such that the maximum is 1
    max_h = max(probs.values())
    height = {(x, y): 0.0 for x in range(Lx) for y in range(Ly)}
    for bitstring, value in probs.items():
        if bitstring in grid:
            height[grid[bitstring]] = float(value) / max_h

    # take logs if required
    if log:
        min_h = min([height[pos] for pos in height if height[pos] != 0])
        base = 1 / min_h
        for pos in height:
            if height[pos] > 0:
                height[pos] = max(math.log(height[pos] / min_h) / math.log(base), 0)
            else:
                height[pos] = 0.0

    return height


def circuit2height(qc: QuantumCircuit, log: bool = False):
    """
    Extracts a dictionary of heights (or brightnesses) on a grid from
    the quantum circuit into which it has been encoded.

    Args:
        qc (QuantumCircuit): A quantum circuit which encodes a height
            dictionary. The name attribute should hold the size of
            the image to be created (as a tuple cast to a string).
        log (bool): If given, a logarithmic decoding is used.

    Returns:
        height (dict): A dictionary in which keys are coordinates
            for points on a grid, and the values are floats in the
            range 0 to 1.
    """

    probs = circuit2probs(qc)
    try:
        # get size from circuit
        size = eval(qc.name)
    except Exception:
        # if not in circuit name, infer it from qubit number
        L = int(2 ** (qc.num_qubits / 2))
        size = (L, L)
    return probs2height(probs, size=size, log=log)


def heights2image(heights: list[Height]):
    """
    Constructs an image from a set of three height dictionaries, one for each
    colour channel.
    """
    Lx, Ly = get_size(heights[0])
    h_max = [max(height.values()) for height in heights]

    image = newimage("RGB", (Lx, Ly))

    for x in range(Lx):
        for y in range(Ly):
            if len(heights) == 1:
                height = heights[0]
                if (x, y) in height:
                    h = float(height[x, y]) / h_max[0]
                else:
                    h = 0
                image.putpixel((x, y), (int(255 * h), int(255 * h), int(255 * h)))
            else:
                rgb: list[int] = []
                for j, height in enumerate(heights):
                    if (x, y) in height:
                        h = float(height[x, y]) / h_max[j]
                    else:
                        h = 0

                    rgb.append(int(255 * h))
                while len(rgb) < 3:
                    rgb.append(0)
                image.putpixel((x, y), tuple(rgb))

    return image


def circuits2image(circuits: list[QuantumCircuit], log: bool = False):
    """
    Extracts an image from list of circuits encoding the RGB channels.

    Args:
        circuits (list): A list of quantum circuits encoding the image.
        log (bool): If given, a logarithmic decoding is used.

    Returns:
        image (Image): An RGB encoded image.
    """

    heights: list[Height] = []
    for qc in circuits:
        heights.append(circuit2height(qc, log=log))
    return heights2image(tuple(heights))


def blur_height(
    height: Height,
    xi: float,
    axis: Literal["x", "y"] = "x",
    circuit: QuantumCircuit | None = None,
    log: bool = False,
) -> QuantumCircuit:
    """
    Applies a predetermined blur effect designed for a smooth blur.

    Args:
        height (dict): A dictionary in which keys are coordinates
            for points on a grid, and the values are positive numbers of
            any type.
        xi (float): Fraction of pi rotation to apply on the qubit for
            which the largest rotation is aplied
        axis (string): `rx` rotations are used when this is `'x'`, and
            `ry` rotations are used otherwise.
        circuit (QuantumCircuit): Rotations are applied to the given circuit
            if supplied. Otherwise one is made from `height`.
        log (bool): If True, a logarithmic encoding is used.

    Returns:
        circuit (QuantumCircuit): Circuit on which the blur effect has been
            added.
    """

    # get size and bit strings for the grid
    Lx, Ly = get_size(height)
    grid, n = make_grid(Lx, Ly)
    # invert grid dict to have coords as keys
    coord_grid = {grid[string]: string for string in grid}

    rates: list[float] = [0] * n
    for x in range(Lx):
        for y in range(Ly):
            # for this point, go through all neighbours
            # and find all bits on which address differs
            string = coord_grid[x, y]
            axes = []
            for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                if (x + dx, y + dy) in coord_grid:
                    nstring = coord_grid[x + dx, y + dy]
                    for j, b in enumerate(nstring):
                        if b != string[j]:
                            axes.append(n - j - 1)
            # add the height at this point to the rates for each of these
            for j in axes:
                if (x, y) in height:
                    rates[j] += height[x, y]

    # normalize the rates
    max_rate = max(rates)
    if max_rate == 0:
        max_rate = 1
    for j in range(n):
        rates[j] /= max_rate

    # make the circuit the rotation
    qc_rot = QuantumCircuit(n)
    for j in range(n):
        theta = math.pi * rates[j] * math.pi * xi
        if axis == "x":
            qc_rot.rx(theta, j)
        else:
            qc_rot.ry(theta, j)

    # add to initial circuit
    if circuit:
        composed_circuit = circuit.compose(qc_rot)
    else:
        composed_circuit = height2circuit(height, log=log).compose(qc_rot)
    composed_circuit.name = "(" + str(Lx) + "," + str(Ly) + ")"

    return composed_circuit


class Circuits:
    def __init__(
        self, circuits: list[QuantumCircuit], heights: list[Height], log: bool = False
    ):
        self._circuits = circuits
        self._log = log
        self._heights = heights

    @staticmethod
    def image2heights(image: Image) -> list[Height]:
        """
        Converts an rgb image into a list of three height dictionaries, one for
        each colour channel.
        """
        Lx, Ly = image.size
        p = image.getpixel((0, 0))

        heights: list[Height] = (
            [{}] if isinstance(p, int) else [{} for _ in range(len(p))]
        )
        for x in range(Lx):
            for y in range(Ly):
                rgb: tuple[int, int, int] | int = image.getpixel((x, y))
                if isinstance(rgb, int):
                    heights[0][x, y] = rgb
                else:
                    for j in range(3):
                        heights[j][x, y] = rgb[j]

        return heights

    @classmethod
    def from_image(cls, image: Image, log: bool = False):
        heights = cls.image2heights(image)

        circuits: list[QuantumCircuit] = []
        valid_heights: list[Height] = []
        for height in heights:
            if all(h == 0 for h in height.values()):
                continue
            circuits.append(height2circuit(height, log=log))
            valid_heights.append(height)

        return cls(circuits, valid_heights, log=log)

    def apply(self, action: Callable[[QuantumCircuit], None]):
        for circuit in self._circuits:
            action(circuit)

    def to_image(self) -> Image:
        return circuits2image(self._circuits, self._log)

    def blur(self, xi: float, axis: Literal["x", "y"] = "x"):
        self._circuits = [
            blur_height(height, xi, axis=axis, circuit=self._circuits[j], log=self._log)
            for j, height in enumerate(self._heights)
        ]
