<?php

require_once 'database.php';

session_start();
if (isset($_SESSION['uid'])){
    $uid = $_SESSION['uid'];
}

$ids = explode("\n", file_get_contents('id.txt'));
$id = $ids[0];

$sql = "SELECT * FROM amoeba WHERE id = '$id'";
$query = $db->query($sql);
$result = mysqli_fetch_assoc($query);
$owner = $result['uid'];
$url = $result['url'];
$img3 = $result['test_3_img'];
$img2 = $result['test_2_img'];
$img1 = $result['test_1_img'];

$user_sql = "SELECT * FROM users WHERE id = '$owner'";
$user_query = $db->query($user_sql);
$user_result = mysqli_fetch_assoc($user_query);

?>

<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
		<!-- BASICS -->
        <meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Amoeba</title>
        <meta name="description" content="">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="css/isotope.css" media="screen" />	
		<link rel="stylesheet" href="js/fancybox/jquery.fancybox.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="css/bootstrap.css">
		<link rel="stylesheet" href="css/bootstrap-theme.css">
        <link rel="stylesheet" href="css/style.css">
		<script src="js/jquery.js"></script>
		<script src="js/jquery.easing.1.3.js"></script>
    	<script src="js/bootstrap.min.js"></script>
		<!-- skin -->
		<link rel="stylesheet" href="skin/default.css">

		<link href="bootstrap3-editable/css/bootstrap-editable.css" rel="stylesheet">
    	<link rel="stylesheet" type="text/css" href="style.css">
    	<script src="bootstrap3-editable/js/bootstrap-editable.js"></script>
    	<script src="js/validator.min.js"></script>
    </head>
	 
    <body>
		<section id="header" class="appear"></section>
		<div class="navbar navbar-fixed-top" role="navigation" data-0="line-height:100px; height:100px; background-color:rgba(0,0,0,0.3);" data-300="line-height:60px; height:60px; background-color:rgba(0,0,0,1);">
			 <div class="container">
				<div class="navbar-header">
					<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
						<span class="fa fa-bars color-white"></span>
					</button>
					<h1><a class="navbar-brand" href="index.php" data-0="line-height:90px;" data-300="line-height:50px;">			Amoeba
					</a></h1>
				</div>
				<div class="navbar-collapse collapse">
					<ul class="nav navbar-nav" data-0="margin-top:20px;" data-300="margin-top:5px;">
						<li class="active"><a href="index.php">Home</a></li>
						<li><a href="#section-about">About</a></li>
						<li><a href="#section-works">Portfolio</a></li>
						<li><a href="#section-contact">Contact</a></li>
						<?php
						if(isset($_SESSION['uid']) && ($owner == $uid))
						{
							if (!isset($_GET['edit'])) {
								echo '<li><a href="index.php?edit" class="nav-btn btn btn-success">Edit Now</a></li>';
							} else {
								echo '<li><a href="index.php" class="nav-btn btn btn-info">View Mode</a></li>';
							}
						}
						?>
					</ul>
				</div><!--/.navbar-collapse -->
			</div>
		</div>

		<section class="featured">
			<div class="container"> 
				<div class="row mar-bot40">
					<div class="col-md-6 col-md-offset-3">
						
						<div class="align-center">
							<i class="fa fa-flask fa-5x mar-bot20"></i>
							<h2 class="slogan" id="main_title" data-type="text" data-pk="<?= $id ?>" data-name="main_title"><?= $result['main_title'] ?></h2>
							<p id="main_paragraph" data-pk="<?= $id ?>" data-type="textarea" data-name="main_paragraph"><?= $result['main_paragraph'] ?></p>	
						</div>
					</div>
				</div>
			</div>
		</section>
		
		<!-- services -->
		<section id="section-services" class="section pad-bot30 bg-white">
		<div class="container"> 
		
			<div class="row mar-bot40">
				<div class="col-lg-4" >
					<div class="align-center">
						<i class="fa fa-code fa-5x mar-bot20"></i>
						<h4 class="text-bold" id="f_1_title" data-pk="<?= $id ?>" data-type="text" data-name="f_1_title"><?= $result['f_1_title'] ?></h4>
						<p id="f_1_text" data-pk="<?= $id ?>" data-type="textarea" data-name="f_1_text"><?= $result['f_1_text'] ?></p>
					</div>
				</div>
					
				<div class="col-lg-4" >
					<div class="align-center">
						<i class="fa fa-terminal fa-5x mar-bot20"></i>
						<h4 class="text-bold" id="f_2_title" data-pk="<?= $id ?>" data-type="text" data-name="f_2_title"><?= $result['f_2_title'] ?></h4>
						<p id="f_2_text" data-pk="<?= $id ?>" data-type="textarea" data-name="f_2_text"><?= $result['f_2_text'] ?></p>
					</div>
				</div>
			
				<div class="col-lg-4" >
					<div class="align-center">
						<i class="fa fa-bolt fa-5x mar-bot20"></i>
						<h4 class="text-bold" id="f_3_title" data-pk="<?= $id ?>" data-type="text" data-name="f_3_title"><?= $result['f_3_title'] ?></h4>
						<p id="f_3_text" data-pk="<?= $id ?>" data-type="textarea" data-name="f_3_text"><?= $result['f_3_text'] ?></p>
					</div>
				</div>
			
			</div>	

		</div>
		</section>
			
		<!-- spacer section:testimonial -->
		<section id="testimonials" class="section" data-stellar-background-ratio="0.5" style="background-image: url('<?= $img1 ?>');">
		<div class="container">
			<div class="row">				
					<div class="col-lg-12">
							<div class="align-center">
        						<div class="testimonial testimonial1 pad-top40 pad-bot40 clearfix">
        							<h5 id="test_1_quote" data-pk="<?= $id ?>" data-type="textarea" data-name="test_1_quote"><?= $result['test_1_quote'] ?></h5>
        							<br/>
        							<span class="author" id="test_1_person" data-pk="<?= $id ?>" data-type="text" data-name="test_1_person"><?= $result['test_1_person'] ?></span>
        						</div>

							</div>
					</div>
				
			</div>	
		</div>
		<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image">
			<label for="file1" class="upload-btn" id="upload1">UPLOAD IMAGE</label>
			<input type="file" name="file" id="file1" class="file" />
			<input type="hidden" name="id" value="<?= $id ?>">
			<input type="hidden" name="place" value="test_1_img">
			<input type="hidden" name="url" value="<?= $url ?>">
		</form>
		</section>
			
		<!-- about -->
		<section id="section-about" class="section appear clearfix">
		<div class="container">

				<div class="row mar-bot40">
					<div class="col-md-offset-3 col-md-6">
						<div class="section-header team-text">
							<h2 class="section-heading animated" data-animation="bounceInUp" id="team_title" data-pk="<?= $id ?>" data-type="text" data-name="team_title"><?= $result['team_title'] ?></h2>
							<p id="team_text" data-pk="<?= $id ?>" data-type="textarea" data-name="team_text"><?= $result['team_text'] ?></p>
						</div>
					</div>
				</div>

					<div class="row align-center mar-bot40">
						<div class="col-md-3">
							<div class="team-member" id="member1">
								<img src="<?= $result['team_per_1_img']; ?>" alt="" style="width: 100%;" />
								<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image4">
									<label for="file4" class="upload-btn" id="upload4">UPLOAD IMAGE</label>
									<input type="file" name="file" id="file4" class="file" />
									<input type="hidden" name="id" value="<?= $id ?>">
									<input type="hidden" name="place" value="team_per_1_img">
									<input type="hidden" name="url" value="<?= $url ?>">
								</form><br>
								<div class="team-detail">
									<h4 id="team_per_1_name" data-pk="<?= $id ?>" data-type="text" data-name="team_per_1_name"><?= $result['team_per_1_name'] ?></h4>
									<span id="team_per_1_job" data-pk="<?= $id ?>" data-type="text" data-name="team_per_1_job"><?= $result['team_per_1_job'] ?></span>
								</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="team-member" id="member2">
								<img src="<?= $result['team_per_2_img']; ?>" alt="" style="width: 100%;" />
								<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image5">
									<label for="file5" class="upload-btn" id="upload5">UPLOAD IMAGE</label>
									<input type="file" name="file" id="file5" class="file" />
									<input type="hidden" name="id" value="<?= $id ?>">
									<input type="hidden" name="place" value="team_per_2_img">
									<input type="hidden" name="url" value="<?= $url ?>">
								</form><br>
								<div class="team-detail">
									<h4 id="team_per_2_name" data-pk="<?= $id ?>" data-type="text" data-name="team_per_2_name"><?= $result['team_per_2_name'] ?></h4>
									<span id="team_per_2_job" data-pk="<?= $id ?>" data-type="text" data-name="team_per_2_job"><?= $result['team_per_2_job'] ?></span>
								</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="team-member" id="member3">
								<img src="<?= $result['team_per_3_img']; ?>" alt="" style="width: 100%;" />
								<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image6">
									<label for="file6" class="upload-btn" id="upload6">UPLOAD IMAGE</label>
									<input type="file" name="file" id="file6" class="file" />
									<input type="hidden" name="id" value="<?= $id ?>">
									<input type="hidden" name="place" value="team_per_3_img">
									<input type="hidden" name="url" value="<?= $url ?>">
								</form><br>
								<div class="team-detail">
									<h4 id="team_per_3_name" data-pk="<?= $id ?>" data-type="text" data-name="team_per_3_name"><?= $result['team_per_3_name'] ?></h4>
									<span  id="team_per_3_job" data-pk="<?= $id ?>" data-type="text" data-name="team_per_3_job"><?= $result['team_per_3_job'] ?></span>
								</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="team-member" id="member4">
								<img src="<?= $result['team_per_4_img']; ?>" alt="" style="width: 100%;" />
								<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image7">
									<label for="file7" class="upload-btn" id="upload7">UPLOAD IMAGE</label>
									<input type="file" name="file" id="file7" class="file" />
									<input type="hidden" name="id" value="<?= $id ?>">
									<input type="hidden" name="place" value="team_per_4_img">
									<input type="hidden" name="url" value="<?= $url ?>">
								</form><br>
								<div class="team-detail">
									<h4 id="team_per_4_name" data-pk="<?= $id ?>" data-type="text" data-name="team_per_4_name"><?= $result['team_per_4_name'] ?></h4>
									<span  id="team_per_4_job" data-pk="<?= $id ?>" data-type="text" data-name="team_per_4_job"><?= $result['team_per_4_job'] ?></span>
								</div>
							</div>
						</div>
					</div>
						
		</div>
		</section>
		<!-- /about -->
		
		<!-- spacer section:stats -->
		<section id="parallax1" class="section pad-top40 pad-bot40" style="background-image: url('<?= $img2; ?>');" data-stellar-background-ratio="0.5">
			<div class="container">
            <div class="align-center pad-top40 pad-bot40">
                <blockquote class="bigquote color-white" id="test_2_quote" data-pk="<?= $id ?>" data-type="text" data-name="test_2_quote"><?= $result['test_2_quote'] ?></blockquote>
				<p class="color-white"  id="test_2_person" data-pk="<?= $id ?>" data-type="text" data-name="test_2_person"><?= $result['test_2_person'] ?></p>
            </div>
			</div>
			<form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image2">
				<label for="file2" class="upload-btn" id="upload2">UPLOAD IMAGE</label>
				<input type="file" name="file" id="file2" class="file" />
				<input type="hidden" name="id" value="<?= $id ?>">
				<input type="hidden" name="place" value="test_2_img">
				<input type="hidden" name="url" value="<?= $url ?>">
			</form>
		</section>
		
		<!-- section works -->
		<section id="section-works" class="section appear clearfix">
			<div class="container">
				
				<div class="row mar-bot40">
					<div class="col-md-offset-3 col-md-6">
						<div class="section-header">
							<h2 class="section-heading animated" data-animation="bounceInUp">Portfolio</h2>
							<p>Comming Soon In Editable Form</p>
						</div>
					</div>
				</div>
					<!--
                        <div class="row">
                          <nav id="filter" class="col-md-12 text-center">
                            <ul>
                              <li><a href="#" class="current btn-theme btn-small" data-filter="*">All</a></li>
                              <li><a href="#"  class="btn-theme btn-small" data-filter=".webdesign" >Web Design</a></li>
                              <li><a href="#"  class="btn-theme btn-small" data-filter=".photography">Photography</a></li>
                              <li ><a href="#" class="btn-theme btn-small" data-filter=".print">Print</a></li>
                            </ul>
                          </nav>
                          <div class="col-md-12">
                            <div class="row">
                              <div class="portfolio-items isotopeWrapper clearfix" id="3">
							  
                                <article class="col-md-4 isotopeItem webdesign">
									<div class="portfolio-item">
										<img src="img/portfolio/img1.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img1.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem photography">
									<div class="portfolio-item">
										<img src="img/portfolio/img2.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img2.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>
								

                                <article class="col-md-4 isotopeItem photography">
									<div class="portfolio-item">
										<img src="img/portfolio/img3.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img3.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem print">
									<div class="portfolio-item">
										<img src="img/portfolio/img4.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img4.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem photography">
									<div class="portfolio-item">
										<img src="img/portfolio/img5.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img5.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem webdesign">
									<div class="portfolio-item">
										<img src="img/portfolio/img6.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img6.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem print">
									<div class="portfolio-item">
										<img src="img/portfolio/img7.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img7.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem photography">
									<div class="portfolio-item">
										<img src="img/portfolio/img8.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img8.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>

                                <article class="col-md-4 isotopeItem print">
									<div class="portfolio-item">
										<img src="img/portfolio/img9.jpg" alt="" />
										 <div class="portfolio-desc align-center">
											<div class="folio-info">
												<h5><a href="#">Portfolio name</a></h5>
												<a href="img/portfolio/img9.jpg" class="fancybox"><i class="fa fa-plus fa-2x"></i></a>
											 </div>										   
										 </div>
									</div>
                                </article>
                                </div>
                                        
							</div>
                                     

							</div>
                        </div> -->
				
			</div>
		</section>
		<section id="parallax2" class="section parallax" data-stellar-background-ratio="0.5" style="background-image: url('<?= $img3 ?>');">	
            <div class="align-center pad-top40 pad-bot40">
                <blockquote class="bigquote color-white" id="test_3_quote" data-pk="<?= $id ?>" data-type="text" data-name="test_3_quote"><?= $result['test_3_quote'] ?></blockquote>
				<p class="color-white" id="test_3_person" data-pk="<?= $id ?>" data-type="text" data-name="test_3_person"><?= $result['test_3_person'] ?></p>
            </div>
            <form method="POST" action="upload-image.php" enctype="multipart/form-data" id="send-image3">
				<label for="file3" class="upload-btn" id="upload3">UPLOAD IMAGE</label>
				<input type="file" name="file" id="file3" class="file" />
				<input type="hidden" name="id" value="<?= $id ?>">
				<input type="hidden" name="place" value="test_3_img">
				<input type="hidden" name="url" value="<?= $url ?>">
			</form>
		</section>

		<!-- contact -->
		<section id="section-contact" class="section appear clearfix">
			<div class="container">
				
				<div class="row mar-bot40">
					<div class="col-md-offset-3 col-md-6">
						<div class="section-header contact-editable">
							<h2 class="section-heading animated" data-animation="bounceInUp" id="contact_title" data-pk="<?= $id ?>" data-name="contact_title" data-type="text"><?= $result['contact_title'] ?></h2>
							<p id="contact_text" data-pk="<?= $id ?>" data-name="contact_text" data-type="textarea"><?= $result['contact_text'] ?></p>
						</div>
					</div>
				</div>
				<div class="row">
					<div class="col-md-8 col-md-offset-2">
						<div class="cform" id="contact-form">
							<div id="sendmessage">
								 Your message has been sent. Thank you!
							</div>
                            <div id="errormessage"></div>
							<form action="contactform/mail.php" method="post" role="form" class="contactForm" data-toogle="validator">
							  <div class="form-group">
								<label for="name">Your Name</label>
								<input type="text" name="name" class="form-control" id="name" placeholder="Your Name" required="" />
								<div class="validation"></div>
							  </div>
							  <div class="form-group">
								<label for="email">Your Email</label>
								<input type="email" class="form-control" name="email" id="email" placeholder="Your Email" required=""/>
								<div class="validation"></div>
							  </div>
							  <div class="form-group">
								<label for="subject">Subject</label>
								<input type="text" class="form-control" name="subject" id="subject" placeholder="Subject" required="" />
								<div class="validation"></div>
							  </div>
							  <div class="form-group">
								<label for="message">Message</label>
								<textarea class="form-control" name="message" rows="5" required=""></textarea>
								<div class="validation"></div>
							  </div>
							  <input type="hidden" name="t-email" value="<?= $user_result['email'] ?>">
							  <button type="submit" class="btn btn-theme pull-left">SEND MESSAGE</button>
							</form>

						</div>
					</div>
					<!-- ./span12 -->
				</div>
				
			</div>
		</section>

	<section id="footer" class="section footer">
		<div class="container">
			<div class="row animated opacity mar-bot20" data-andown="fadeIn" data-animation="animation">
				<div class="col-sm-12 align-center">
                    <ul class="social-network social-circle">
                        <li><a href="#" class="icoRss" title="Rss"><i class="fa fa-rss"></i></a></li>
                        <li><a href="#" class="icoFacebook" title="Facebook"><i class="fa fa-facebook"></i></a></li>
                        <li><a href="#" class="icoTwitter" title="Twitter"><i class="fa fa-twitter"></i></a></li>
                        <li><a href="#" class="icoGoogle" title="Google +"><i class="fa fa-google-plus"></i></a></li>
                        <li><a href="#" class="icoLinkedin" title="Linkedin"><i class="fa fa-linkedin"></i></a></li>
                    </ul>				
				</div>
			</div>

			<div class="row align-center copyright">
					<div class="col-sm-12"><p>Copyright &copy; Amoeba</p>
                        <div class="credits">
                            <!-- 
                                All the links in the footer should remain intact. 
                                You can delete the links only if you purchased the pro version.
                                Licensing information: https://bootstrapmade.com/license/
                                Purchase the pro version with working PHP/AJAX contact form: https://bootstrapmade.com/buy/?theme=Amoeba
                            -->
                            <a href="https://bootstrapmade.com/">Bootstrap Themes</a> by <a href="https://bootstrapmade.com/">BootstrapMade</a>
                        </div>
                    </div>
			</div>
		</div>

	</section>
	<a href="#header" class="scrollup"><i class="fa fa-chevron-up"></i></a>	

	<script src="js/modernizr-2.6.2-respond-1.1.0.min.js"></script>
	<script src="js/jquery.isotope.min.js"></script>
	<script src="js/jquery.nicescroll.min.js"></script>
	<script src="js/fancybox/jquery.fancybox.pack.js"></script>
	<script src="js/skrollr.min.js"></script>		
	<script src="js/jquery.scrollTo-1.4.3.1-min.js"></script>
	<script src="js/jquery.localscroll-1.2.7-min.js"></script>
	<script src="js/stellar.js"></script>
	<script src="js/jquery.appear.js"></script>
    <script src="js/main.js"></script>
    <script src="contactform/contactform.js"></script>
    <?php if(isset($_SESSION['uid']) && ($owner == $uid) && isset($_GET['edit']) ): ?>
    <script>
    	$(document).ready(function(){
    		
    		$.fn.editable.defaults.mode = 'inline';

    		$('#main_title').editable({
    			title: 'Enter Title',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#main_paragraph').editable({
    			title: 'Enter Paragraph',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_1_title').editable({
    			title: 'Enter Featured 1 Title',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_1_text').editable({
    			title: 'Enter Featured 1 Text',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_2_title').editable({
    			title: 'Enter Featured 2 Title',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_2_text').editable({
    			title: 'Enter Featured 2 Text',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_3_title').editable({
    			title: 'Enter Featured 3 Title',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#f_3_text').editable({
    			title: 'Enter Featured 3 Text',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_1_quote').editable({
    			title: 'Enter Quote 1',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_1_person').editable({
    			title: 'Enter Person 1',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_title').editable({
    			title: 'Enter Team Title',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_text').editable({
    			title: 'Enter Team Info',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_1_name').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_1_job').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_2_name').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_2_job').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});
    		$('#team_per_3_name').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_3_job').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_4_name').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#team_per_4_job').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_2_quote').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_2_person').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_3_quote').editable({
    			title: 'Enter Person\'s Name ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#test_3_person').editable({
    			title: 'Enter Person\'s Job',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#contact_title').editable({
    			title: 'Enter Title For Contact ',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$('#contact_text').editable({
    			title: 'Enter text of contact',
    			url: 'upload.php',
    			method: 'POST',
    			validate: function(value){
    				if ($.trim(value) == '') {
    					return 'Can Not Be Empty !';
    				}
    			}
    		});

    		$("#testimonials").mouseover(
				function(){

					$("#upload1").show();

				}
			);

			$("#testimonials").mouseout(
				function(){

					$("#upload1").hide();

				}
			);

			$("#parallax1").mouseover(
				function(){

					$("#upload2").show();

				}
			);

			$("#parallax1").mouseout(
				function(){

					$("#upload2").hide();

				}
			);

			$("#parallax2").mouseover(
				function(){

					$("#upload3").show();

				}
			);

			$("#parallax2").mouseout(
				function(){

					$("#upload3").hide();

				}
			);

			$('#file1').change(function(){
				$('#send-image').submit();
			});

			$('#file2').change(function(){
				$('#send-image2').submit();
			});

			$('#file3').change(function(){
				$('#send-image3').submit();
			});

			$("#member1").mouseover(
				function(){

					$("#upload4").show();

				}
			);

			$("#member1").mouseout(
				function(){

					$("#upload4").hide();

				}
			);

			$("#member2").mouseover(
				function(){

					$("#upload5").show();

				}
			);

			$("#member2").mouseout(
				function(){

					$("#upload5").hide();

				}
			);

			$("#member3").mouseover(
				function(){

					$("#upload6").show();

				}
			);

			$("#member3").mouseout(
				function(){

					$("#upload6").hide();

				}
			);

			$("#member4").mouseover(
				function(){

					$("#upload7").show();

				}
			);

			$("#member4").mouseout(
				function(){

					$("#upload7").hide();

				}
			);

			$('#file4').change(function(){
				$('#send-image4').submit();
			});

			$('#file5').change(function(){
				$('#send-image5').submit();
			});

			$('#file6').change(function(){
				$('#send-imag6').submit();
			});

			$('#file7').change(function(){
				$('#send-image7').submit();
			});

    	});
   	</script>
   	<?php endif; ?>
	</body>
</html>