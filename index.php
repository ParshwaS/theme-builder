<?php

require_once 'database.php';
include 'includes/head.php';

session_start();
if (!isset($_SESSION['uid'])) {
    header("Location: login.php");
} else {
    $uid = $_SESSION['uid'];
}

$sql = "SELECT * FROM templates";
$result = $db->query($sql);

?>

    <h1 class="text-center">Create Your Site With Us Easily</h1><hr width="65%"><br><br><br>
    <div class="row">
        <div class="col-md-4"></div>
        <div class="col-md-4">
            <form class="form-horizontal" data-toggle="validator" action="new-theme.php" method="POST">
                <div class="form-group">
                    <label class="col-md-3 control-label">vector32.cf/</label>
                    <div class="col-md-9">
                        <input type="text" name="url" class="form-control" required data-remote="validate.php">
                        <div class="help-block">Put The Url You Want Like <code class="dark">http://vector32.cf/example</code></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-md-3 control-label">Select A Theme</label>
                    <div class="col-md-9">
                        <select class="form-control" name="theme">
                        <?php while($row = mysqli_fetch_assoc($result)): ?>
                            <option value="<?= $row['name'] ?>"><?= $row['name'] ?></option>
                        <?php endwhile; ?>
                        </select>
                    </div><hr><br>
                </div>
                <div class="form-group">
                    <div class="col-md-offset-3">
                        <div class="col-md-9 text-center">
                            <input type="submit" value='Create' name="create-new" class="btn btn-success">
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="col-md-4"></div>
    </div>
    <div class="row">
        <div class="col-md-4"></div>
        <div class="col-md-4">
            <h2 class="text-center">Your Sites</h2><hr width="65%">
            <div class="table-responsive">
                <table class="table tabl-stripped table-bordered">
                    <thead>
                        <th>Site Name</th>
                        <th>Site Url</th>
                        <th>Delete</th>
                    </thead>
                    <tbody id="sites">

                    </tbody>
                </table>
            </div>
        </div>
        <div class="col-md-4"></div>
    </div>

<script>
    function load_sites() {
        var data = {'id': <?= $uid ?>};
        $.ajax({
            url: 'sites.php',
            method: 'get',
            data: data,
            success: function(data){
                $('#sites').html(data);
            },
            error: function(){
                alert("Something Is Wrong With Loading Sites");
            }
        });
    }

    load_sites();

    // function delete_site(template, id, url) {
    //     var data = {'template' : template,
    //                 'id' : id,
    //                 'url': url};
    //     $.ajax({
    //         url: 'delete.php',
    //         method: 'get',
    //         data: data,
    //         success: function(data){
    //             load_sites();
    //         },
    //         error: function(data){
    //             alert("Can't Delete...");
    //         }
    //     });
    // }
</script>

 <?php include 'includes/footer.php'; ?>