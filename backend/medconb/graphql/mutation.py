import medconb.interactors as interactors

from .helper import InteractorResolver
from .objects import MutationType

mutation = MutationType()

mutation.set_field("createCollection", InteractorResolver(interactors.CreateCollection))
mutation.set_field("deleteCollection", InteractorResolver(interactors.DeleteCollection))
mutation.set_field("updateCollection", InteractorResolver(interactors.UpdateCollection))
mutation.set_field("moveCollection", InteractorResolver(interactors.MoveCollection))
mutation.set_field(
    "setCollectionPermissions", InteractorResolver(interactors.SetCollectionPermissions)
)

mutation.set_field("createPhenotype", InteractorResolver(interactors.CreatePhenotype))
mutation.set_field("updatePhenotype", InteractorResolver(interactors.UpdatePhenotype))
mutation.set_field("deletePhenotype", InteractorResolver(interactors.DeletePhenotype))
mutation.set_field("clonePhenotype", InteractorResolver(interactors.ClonePhenotype))

mutation.set_field("createCodelist", InteractorResolver(interactors.CreateCodelist))
mutation.set_field("updateCodelist", InteractorResolver(interactors.UpdateCodelist))
mutation.set_field("deleteCodelist", InteractorResolver(interactors.DeleteCodelist))
mutation.set_field("cloneCodelist", InteractorResolver(interactors.CloneCodelist))
mutation.set_field("moveCodelist", InteractorResolver(interactors.MoveCodelist))

mutation.set_field("importCodelists", InteractorResolver(interactors.ImportCodelists))

mutation.set_field("commitChanges", InteractorResolver(interactors.CommitChanges))
mutation.set_field(
    "storeTransientChanges", InteractorResolver(interactors.StoreTransientChanges)
)
mutation.set_field(
    "discardTransientChanges", InteractorResolver(interactors.DiscardTransientChanges)
)

mutation.set_field("updateMe", InteractorResolver(interactors.UpdateMe))
