from firebase_functions import https_fn, firestore_fn, storage_fn
from firebase_admin import initialize_app, storage, firestore
import pathlib
from PIL import Image
import io

initialize_app()

BUCKET_NAME = "quantum-blur.appspot.com"


@https_fn.on_call(region="europe-west1")
def on_demo_call(req: https_fn.Request) -> https_fn.Response:
    print(req.data, req.auth.uid)
    return {"msg": "Hello world!", "echo": req.data, "uid": req.auth.uid}


@storage_fn.on_object_finalized(region="europe-west1")
def on_object_finalized_example(
    event: storage_fn.CloudEvent[storage_fn.StorageObjectData],
):
    file_path = pathlib.PurePath(event.data.name)
    bucket_name = event.data.bucket

    if bucket_name != BUCKET_NAME:
        print(f"This file is not in the correct bucket. Bucket: {bucket_name}; Expected: {BUCKET_NAME}")
        return

    parts = file_path.parts
    if parts[0] != "userUploads":
        print("This file is not in the userUploads folder.", file_path)
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
