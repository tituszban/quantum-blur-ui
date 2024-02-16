from firebase_functions import https_fn, storage_fn, options
from firebase_admin import initialize_app, storage, firestore
import pathlib
from PIL import Image
import io
from quantumblur import Circuits
import numpy as np

initialize_app()

BUCKET_NAME = "quantum-blur.appspot.com"


@https_fn.on_call(region="europe-west1")
def on_demo_call(req: https_fn.Request) -> https_fn.Response:
    print(req.data, req.auth.uid)
    return {"msg": "Hello world!", "echo": req.data, "uid": req.auth.uid}

@https_fn.on_call(region="europe-west1", memory=options.MemoryOption.GB_1)
def on_quantum_blur(req: https_fn.Request) -> https_fn.Response:
    file_id = req.data["fileId"]

    log = req.data.get("log", False)
    xi = req.data.get("xi", 0.5)

    bucket = storage.bucket(BUCKET_NAME)

    def path_from_id(_file_id: str) -> str:
        return str(pathlib.Path(f"userFiles/{req.auth.uid}/{_file_id}"))

    image_blob = bucket.blob(path_from_id(file_id))
    image_bytes = image_blob.download_as_bytes()
    image = Image.open(io.BytesIO(image_bytes))

    firestore_client = firestore.client()

    doc_ref = firestore_client.document(f"users/{req.auth.uid}/uploads/{file_id}")
    file_name = doc_ref.get().to_dict()["fileName"]
    file_name_root = file_name.split(".")[0]

    max_size = max(image.size)
    if max_size > 256:
        image.thumbnail((256, 256))

    c = Circuits.from_image(image, log=log)
    c.blur(xi=xi)
    new_image = c.to_image()

    _, new_doc_ref = firestore_client.collection(f"users/{req.auth.uid}/uploads").add(
        {
            "uploaded": False,
            "type": "image/png",
            "fileName": f"{file_name_root}_blur.png",
            "source": doc_ref,
            "modifications": {
                "rotation": {
                    "log": log,
                    "xi": xi,
                },
            }
        }
    )

    new_image_io = io.BytesIO()
    new_image.save(new_image_io, format="png")

    new_blob = bucket.blob(path_from_id(new_doc_ref.id))
    new_blob.upload_from_string(new_image_io.getvalue(), content_type="image/png")

    new_doc_ref.update({"uploaded": True})

    return {
        "new_doc": new_doc_ref.id,
    }

@https_fn.on_call(region="europe-west1", memory=options.MemoryOption.GB_1)
def on_quantum_rotate(req: https_fn.Request) -> https_fn.Response:
    file_id = req.data["fileId"]

    log = req.data.get("log", False)
    fraction = req.data.get("fraction", 0.25)

    bucket = storage.bucket(BUCKET_NAME)

    def path_from_id(_file_id: str) -> str:
        return str(pathlib.Path(f"userFiles/{req.auth.uid}/{_file_id}"))

    image_blob = bucket.blob(path_from_id(file_id))
    image_bytes = image_blob.download_as_bytes()
    image = Image.open(io.BytesIO(image_bytes))

    firestore_client = firestore.client()

    doc_ref = firestore_client.document(f"users/{req.auth.uid}/uploads/{file_id}")
    file_name = doc_ref.get().to_dict()["fileName"]
    file_name_root = file_name.split(".")[0]

    max_size = max(image.size)
    if max_size > 256:
        image.thumbnail((256, 256))

    def partial_x(qc):
        for j in range(qc.num_qubits):
            qc.rx(np.pi * fraction, j)

    c = Circuits.from_image(image, log=log)
    c.apply(partial_x)
    new_image = c.to_image()

    _, new_doc_ref = firestore_client.collection(f"users/{req.auth.uid}/uploads").add(
        {
            "uploaded": False,
            "type": "image/png",
            "fileName": f"{file_name_root}_rot.png",
            "source": doc_ref,
            "modifications": {
                "rotation": {
                    "log": log,
                    "fraction": fraction,
                },
            }
        }
    )

    new_image_io = io.BytesIO()
    new_image.save(new_image_io, format="png")

    new_blob = bucket.blob(path_from_id(new_doc_ref.id))
    new_blob.upload_from_string(new_image_io.getvalue(), content_type="image/png")

    new_doc_ref.update({"uploaded": True})

    return {
        "new_doc": new_doc_ref.id,
    }


@storage_fn.on_object_finalized(region="europe-west1")
def on_object_finalized_example(
    event: storage_fn.CloudEvent[storage_fn.StorageObjectData],
):
    file_path = pathlib.PurePath(event.data.name)
    bucket_name = event.data.bucket

    if bucket_name != BUCKET_NAME:
        print(
            f"This file is not in the correct bucket. Bucket: {bucket_name}; Expected: {BUCKET_NAME}"
        )
        return

    parts = file_path.parts
    if parts[0] != "userFiles":
        print("This file is not in the userFiles folder.", file_path)
        return
    if len(parts) != 3:
        print("File does not have the correct path parts", parts)
        return

    content_type = event.data.content_type

    # Exit if this is triggered on a file that is not an image.
    if not content_type or not content_type.startswith("image/"):
        print(f"This is not an image. ({content_type})")
        return

    print(file_path, content_type)
    _, uid, file_id = parts

    bucket = storage.bucket(bucket_name)

    image_blob = bucket.blob(str(file_path))
    image_bytes = image_blob.download_as_bytes()
    image = Image.open(io.BytesIO(image_bytes))

    size_x, size_y = image.size

    firestore_client = firestore.client()
    firestore_client.document(f"users/{uid}/uploads/{file_id}").update(
        {"sizeX": size_x, "sizeY": size_y}
    )
